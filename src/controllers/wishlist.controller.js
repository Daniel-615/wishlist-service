const db = require("../models");
const Wishlist = db.getModel("Wishlist");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE } = require("../config/config.js");

class WishlistController {

  async verifyUserAndProduct(user_id, producto_talla_color_id = null, cookie = "") {
    try {
      // Verificar usuario
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: cookie },
      });

      // Verificar producto solo si se proporciona
      if (producto_talla_color_id) {
        await axios.get(`${PRODUCT_SERVICE}/producto-service/producto-talla/${producto_talla_color_id}`, {
          withCredentials: true,
          headers: { Cookie: cookie },
        });
      }

    } catch (err) {
      const status = err.response?.status || 500;
      const message = err.response?.data?.message || err.message;
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }

  async addToWishlist(req, res) {
    const { user_id, producto_talla_color_id } = req.body;
    if (!user_id || !producto_talla_color_id) {
      return res.status(400).send({ message: "Los campos user_id y producto_talla_color_id son obligatorios." });
    }

    try {
      await this.verifyUserAndProduct(user_id, producto_talla_color_id, req.headers.cookie);

      const existente = await Wishlist.findOne({ where: { user_id, producto_talla_color_id } });
      if (existente) {
        return res.status(400).send({ message: "Este producto ya está en la wishlist del usuario." });
      }

      const nuevo = await Wishlist.create({ user_id, producto_talla_color_id });
      return res.status(201).send({ message: "Producto agregado a la wishlist.", wishlist: nuevo });

    } catch (err) {
      const status = err.status || 500;
      return res.status(status).send({ message: err.message || "Error al agregar a la wishlist." });
    }
  }

  async getWishlistByUser(req, res) {
    const user_id = req.params.user_id;
    const cookie = req.headers.cookie || "";

    try {
      await this.verifyUserAndProduct(user_id, null, cookie);

      const rows = await Wishlist.findAll({ where: { user_id }, attributes: ["producto_talla_color_id"] });

      const items = await Promise.all(
        rows.map(async (r) => {
          try {
            const { data: prod } = await axios.get(
              `${PRODUCT_SERVICE}/producto-service/producto-talla/${r.producto_talla_color_id}`,
              { withCredentials: true, headers: { Cookie: cookie } }
            );
            return { producto: prod ?? null };
          } catch {
            return { producto: null, producto_talla_color_id: r.producto_talla_color_id, error: "No se pudo obtener datos del producto" };
          }
        })
      );

      return res.status(200).send(items);

    } catch (err) {
      const status = err.status || 500;
      return res.status(status).send({ message: err.message || "Error al obtener la wishlist." });
    }
  }

  async removeFromWishlist(req, res) {
    const { user_id, producto_talla_color_id } = req.params;

    if (!producto_talla_color_id) {
      return res.status(400).send({ message: "Se requiere producto_talla_color_id para eliminar." });
    }

    try {
      await this.verifyUserAndProduct(user_id, producto_talla_color_id, req.headers.cookie);

      const deleted = await Wishlist.destroy({ where: { user_id, producto_talla_color_id } });
      if (deleted === 1) return res.send({ message: "Producto eliminado de la wishlist." });

      return res.status(404).send({ message: "Producto no encontrado en la wishlist." });

    } catch (err) {
      const status = err.status || 500;
      return res.status(status).send({ message: err.message || "Error al eliminar de la wishlist." });
    }
  }

  async clearWishlist(req, res) {
    const user_id = req.params.user_id;
    try {
      await this.verifyUserAndProduct(user_id, null, req.headers.cookie);

      const deleted = await Wishlist.destroy({ where: { user_id } });
      return res.send({ message: `${deleted} producto(s) eliminado(s) de la wishlist.` });

    } catch (err) {
      const status = err.status || 500;
      return res.status(status).send({ message: err.message || "Error al vaciar la wishlist." });
    }
  }
}

module.exports = WishlistController;
