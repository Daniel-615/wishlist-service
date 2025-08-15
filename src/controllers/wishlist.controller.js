const db = require("../models");
const Wishlist = db.getModel("Wishlist");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE } = require("../config/config.js");

class WishlistController {
  async addToWishlist(req, res) {
    const {user_id} = req.body;
    const { product_id } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).send({ message: "Los campos user_id y product_id son obligatorios." });
    }

    try {
      // Validar usuario
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie || "" },
      });

      // Validar producto
      await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie || "" },
      });
      const existente = await Wishlist.findOne({ where: { user_id, product_id } });
      if (existente) {
        return res.status(400).send({ message: "Este producto ya está en la wishlist del usuario." });
      }
      const nuevo = await Wishlist.create({ user_id, product_id });
      return res.status(201).send({ message: "Producto agregado a la wishlist.", wishlist: nuevo });
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      if ([401, 403].includes(err.response?.status)) {
        return res.status(403).send({ message: "Acceso denegado a autenticación o productos." });
      }
      return res.status(500).send({ message: "Error interno al agregar a la wishlist." });
    }
  }

  async getWishlistByUser(req, res) {
    const user_id = req.params.user_id;

    try {
      const rows = await Wishlist.findAll({
        where: { user_id },
        attributes: ["product_id"],
      });

      // SIEMPRE devolver array
      if (rows.length === 0) return res.status(200).send([]);

      const cookie = req.headers.cookie || "";
      const items = await Promise.all(
        rows.map(async (r) => {
          try {
            const { data: prod } = await axios.get(
              `${PRODUCT_SERVICE}/producto-service/producto/${r.product_id}`,
              { withCredentials: true, headers: { Cookie: cookie } }
            );

            return {
              producto: {
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                descripcion: prod.descripcion ?? null,
                stock: prod.stock ?? null,
                marcaId: prod.marcaId ?? null,
                categoriaId: prod.categoriaId ?? null,
                marca: prod.marca ?? null,
                categoria: prod.categoria ?? null,
              },
            };
          } catch {
            return res.status(400).send({ producto: null, product_id: r.product_id, error: "No se pudo obtener datos del producto" });
          }
        })
      );

      return res.status(200).send(items);
    } catch (err) {
      console.error("Error en getWishlistByUser:", err.message);
      return res.status(500).send({ message: "Error al obtener la wishlist." });
    }
  }

  async removeFromWishlist(req, res) {
    const user_id = req.params.user_id;
    const product_id = req.params.product_id;
    try {

      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie || "" },
      });


      await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie || "" },
      });

      const deleted = await Wishlist.destroy({ where: { user_id, product_id } });
      if (deleted === 1) return res.send({ message: "Producto eliminado de la wishlist." });

      return res.status(404).send({ message: "Producto no encontrado en la wishlist." });
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      if ([401, 403].includes(err.response?.status)) {
        return res.status(403).send({ message: "Acceso denegado a autenticación o productos." });
      }
      return res.status(500).send({ message: "Error al eliminar de la wishlist." });
    }
  }


  async clearWishlist(req, res) {
    const user_id = req.params.user_id;
    try {
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie || "" },
      });

      const deleted = await Wishlist.destroy({ where: { user_id } });
      return res.send({ message: `${deleted} producto eliminado de la wishlist.` });
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario no encontrado." });
      }
      if ([401, 403].includes(err.response?.status)) {
        return res.status(403).send({ message: "Acceso denegado al servicio de autenticación." });
      }
      return res.status(500).send({ message: "Error al vaciar la wishlist." });
    }
  }
}

module.exports = WishlistController;
