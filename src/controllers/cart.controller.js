const db = require("../models");
const Cart = db.getModel("Cart");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE } = require('../config/config.js');

class CartController {
  async addToCart(req, res) {
    const { user_id, product_id, cantidad } = req.body;

    if (!user_id || !product_id || cantidad === undefined) {
      return res.status(400).send({ message: "Los campos user_id, product_id y cantidad son obligatorios." });
    }

    try {
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      const existente = await Cart.findOne({ where: { user_id, product_id } });

      if (existente) {
        existente.cantidad += cantidad;
        await existente.save();
        return res.status(200).send({
          message: "Cantidad actualizada en el carrito.",
          cart: existente,
        });
      }

      const nuevo = await Cart.create({ user_id, product_id, cantidad });
      res.status(201).send({
        message: "Producto agregado al carrito.",
        cart: nuevo,
      });

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      console.error("Error en addToCart:", err.message);
      res.status(500).send({ message: err.message || "Error al agregar al carrito." });
    }
  }

  async getCartByUser(req, res) {
    const user_id = req.params.user_id;

    try {
      const items = await Cart.findAll({ where: { user_id } });

      if (items.length === 0) {
        return res.status(404).send({ message: "Carrito vacío o usuario no encontrado." });
      }

      res.send(items);
    } catch (err) {
      res.status(500).send({ message: "Error al obtener el carrito." });
    }
  }

  async updateCartItem(req, res) {
    const { user_id, product_id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad < 1) {
      return res.status(400).send({ message: "Cantidad inválida." });
    }

    try {
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      const item = await Cart.findOne({ where: { user_id, product_id } });

      if (!item) {
        return res.status(404).send({ message: "Producto no encontrado en el carrito." });
      }

      item.cantidad = cantidad;
      await item.save();

      res.send({ message: "Cantidad actualizada.", cart: item });

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      res.status(500).send({ message: "Error al actualizar el carrito." });
    }
  }

  async removeFromCart(req, res) {
    const { user_id, product_id } = req.params;

    try {
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      const deleted = await Cart.destroy({ where: { user_id, product_id } });

      if (deleted === 1) {
        res.send({ message: "Producto eliminado del carrito." });
      } else {
        res.status(404).send({ message: "Producto no encontrado en el carrito." });
      }

    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario o producto no encontrado." });
      }
      res.status(500).send({ message: "Error al eliminar del carrito." });
    }
  }

  async clearCart(req, res) {
    const user_id = req.params.user_id;

    try {
      await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: {
          Cookie: req.headers.cookie
        }
      });

      const deleted = await Cart.destroy({ where: { user_id } });

      res.send({ message: `${deleted} producto(s) eliminado(s) del carrito.` });
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).send({ message: "Usuario no encontrado." });
      }
      res.status(500).send({ message: "Error al vaciar el carrito." });
    }
  }
}

module.exports = CartController;
