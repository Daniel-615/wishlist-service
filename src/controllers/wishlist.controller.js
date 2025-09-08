const db = require("../models");
const Wishlist = db.getModel("Wishlist");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE, FRONTEND_URL} = require("../config/config.js");
const { programarRecordatorio } = require("../middleware/mailer.js");
const {genShareId}= require("../middleware/generatorId.js")
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
      return res.status(400).send({
        message: "Los campos user_id y producto_talla_color_id son obligatorios.",
      });
    }

    try {
      // Obtener info del usuario desde su microservicio
      const usuario_response = await axios.get(
        `${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`,
        {
          withCredentials: true,
          headers: { Cookie: req.headers.cookie || "" },
        }
      );

      const usuarioEmail = usuario_response.data?.email;
      if (!usuarioEmail) {
        return res.status(400).send({ message: "No se pudo obtener el correo del usuario." });
      }

      // Obtener info del producto desde su microservicio
      const producto_response = await axios.get(
        `${PRODUCT_SERVICE}/producto-service/producto-talla/${producto_talla_color_id}`,
        {
          withCredentials: true,
          headers: { Cookie: req.headers.cookie || "" },
        }
      );

      const productoData = producto_response.data;
      const productoNombre = productoData?.productoColor?.producto?.nombre || "";
      const productoLink = productoData?.productoColor?.imagenUrl || "";

    
      const existente = await Wishlist.findOne({ where: { user_id, producto_talla_color_id } });
      if (existente) {
        return res.status(400).send({ message: "Este producto ya está en la wishlist del usuario." });
      }

      
      const nuevo = await Wishlist.create({ user_id, producto_talla_color_id });

    
      if (productoNombre && productoLink) {
        programarRecordatorio(usuarioEmail, productoNombre, productoLink);
      } else {
        console.warn("No se pudo programar el recordatorio por datos faltantes del producto.");
      }

      return res.status(201).send({
        message: "Producto agregado a la wishlist.",
        wishlist: nuevo,
      });

    } catch (err) {
      console.error("Error en addToWishlist:", err.message);
      const status = err.response?.status || err.status || 500;
      const message = err.response?.data?.message || err.message || "Error al agregar a la wishlist.";
      return res.status(status).send({ message });
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

  //Remover accesos y dar accesos.
  async postUrlShare(req, res) {
    try {
      const { userId } = req.params;
      const { expiresInHours = 72, forceRefresh = false } = req.body || {};

      if (!userId) {
        return res.status(400).send({ message: "No autorizado" });
      }

      const anyRow = await Wishlist.findOne({ where: { user_id: userId } });

      let shareId = anyRow?.share_id;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + Number(expiresInHours) * 3600 * 1000);

      if (!shareId || forceRefresh) {
        shareId = genShareId();
      }

      // aplica a TODAS las filas del usuario
      await Wishlist.update(
        { is_shared: true, share_id: shareId, share_expires_at: expiresAt },
        { where: { user_id: userId } }
      );

      return res.status(200).send({
        success: true,
        shareId,
        url: `${FRONTEND_URL}/wishlist/shared/${shareId}`,
        expiresAt
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "No se pudo generar el enlace" });
    }
  }


  async getSharedWishlistPublic(req, res) {
    try {
      const { shareId } = req.params;
      const one = await Wishlist.findOne({ where: { share_id: shareId, is_shared: true } });

      if (!one) return res.status(404).send({ success: false, message: "Enlace inválido." });

      if (one.share_expires_at && new Date(one.share_expires_at) < new Date()) {
        return res.status(410).send({ success: false, message: "Enlace vencido." });
      }

      const rows = await Wishlist.findAll({ where: { user_id: one.user_id } });

      const items = await Promise.all(rows.map(async (r) => {
        try {
          const resp = await axios.get(`${PRODUCT_SERVICE}/producto-service/producto-talla/${r.producto_talla_color_id}`);
          const p = resp.data?.productoColor || resp.data || {};
          return {
            id: r.id,
            producto_talla_color_id: r.producto_talla_color_id,
            producto: {
              nombre: p?.producto?.nombre || p?.nombre || "Producto",
              precio: p?.producto?.precio ?? null,
              imagen: p?.imagenUrl || p?.imagenes?.[0]?.url || null,
            }
          };
        } catch {
          return { id: r.id, producto_talla_color_id: r.producto_talla_color_id, producto: null };
        }
      }));

      return res.send({ success: true, data: { shareId, items } });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al obtener wishlist pública." });
    }
  }

  // Revoca el enlace (privado; requiere auth)
  async revokeShareLink(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).send({ message: "No autorizado" });
      }

      await Wishlist.update(
        { is_shared: false, share_id: null, share_expires_at: null },
        { where: { user_id: userId } }
      );

      return res.send({ success: true, message: "Enlace revocado." });
    } catch (err) {
      console.error(err);
      return res.status(500).send({ message: "Error al remover el acceso de la wishlist" });
    }
  }

}

module.exports = WishlistController;
