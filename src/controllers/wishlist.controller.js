const db = require("../models");
const Wishlist = db.getModel("Wishlist");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE } = require('../config/config.js');

class WishlistController {
  async addToWishlist(req, res) {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).send({ message: "Los campos user_id y product_id son obligatorios." });
    }
    try {
      // Validar existencia del usuario
      const userRes = await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie }
      });
      console.err(userRes)
      if (userRes.status !== 200) {
        return res.status(403).send({ message: "El usuario no está autorizado o no existe." });
      }

      // Validar existencia del producto
      const productRes = await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie }
      });
      if (productRes.status !== 200) {
        return res.status(403).send({ message: "El producto no está autorizado o no existe." });
      }

      const existente = await Wishlist.findOne({ where: { user_id, product_id } });

      if (existente) {
        return res.status(400).send({ message: "Este producto ya está en la wishlist del usuario." });
      }

      const nuevo = await Wishlist.create({ user_id, product_id });
      res.status(201).send({
        message: "Producto agregado a la wishlist.",
        wishlist: nuevo
      });

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      if (err.response?.status === 403 || err.response?.status === 401) {
        return res.status(403).send({ message: "Acceso denegado a los servicios de autenticación o productos." });
      }

      console.error("Error en addToWishlist:", err.message);
      res.status(500).send({ message: "Error interno al agregar a la wishlist." });
    }
  }

  async getWishlistByUser(req, res) {
    const user_id = req.params.user_id;

    try {
      const items = await Wishlist.findAll({ where: { user_id } });

      if (items.length === 0) {
        return res.status(404).send({ message: "Wishlist vacía o usuario no encontrado." });
      }

      res.send(items);
    } catch (err) {
      console.error("Error en getWishlistByUser:", err.message);
      res.status(500).send({ message: "Error al obtener la wishlist." });
    }
  }

  async removeFromWishlist(req, res) {
    const { user_id, product_id } = req.params;

    try {
      // Validar existencia del usuario
      const userRes = await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie }
      });
      if (userRes.status !== 200) {
        return res.status(403).send({ message: "El usuario no está autorizado o no existe." });
      }

      // Validar existencia del producto
      const productRes = await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie }
      });
      if (productRes.status !== 200) {
        return res.status(403).send({ message: "El producto no está autorizado o no existe." });
      }

      const deleted = await Wishlist.destroy({ where: { user_id, product_id } });

      if (deleted === 1) {
        res.send({ message: "Producto eliminado de la wishlist." });
      } else {
        res.status(404).send({ message: "Producto no encontrado en la wishlist." });
      }

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      if (err.response?.status === 403 || err.response?.status === 401) {
        return res.status(403).send({ message: "Acceso denegado a los servicios de autenticación o productos." });
      }

      console.error("Error en removeFromWishlist:", err.message);
      res.status(500).send({ message: "Error al eliminar de la wishlist." });
    }
  }

  async clearWishlist(req, res) {
    const user_id = req.params.user_id;

    try {
      // Validar existencia del usuario
      const userRes = await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: req.headers.cookie }
      });
      if (userRes.status !== 200) {
        return res.status(403).send({ message: "El usuario no está autorizado o no existe." });
      }

      const deleted = await Wishlist.destroy({ where: { user_id } });
      res.send({ message: `${deleted} producto(s) eliminado(s) de la wishlist.` });

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario no encontrado." });
      }
      if (err.response?.status === 403 || err.response?.status === 401) {
        return res.status(403).send({ message: "Acceso denegado al servicio de autenticación." });
      }

      console.error("Error en clearWishlist:", err.message);
      res.status(500).send({ message: "Error al vaciar la wishlist." });
    }
  }
}

module.exports = WishlistController;
