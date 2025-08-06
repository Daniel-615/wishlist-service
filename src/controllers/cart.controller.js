const db = require("../models");
const Cart = db.getModel("Cart");
const axios = require("axios");
const { PRODUCT_SERVICE, AUTH_SERVICE } = require('../config/config.js');

class CartController {
  async verifyUserAndProduct(user_id, product_id, cookie) {
    try {
      const auth_response = await axios.get(`${AUTH_SERVICE}/auth-service/usuario/findOne/${user_id}`, {
        withCredentials: true,
        headers: { Cookie: cookie }
      });

      if (auth_response.status !== 200) throw new Error("Usuario no válido.");

      if (product_id) {
        const producto_response = await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${product_id}`, {
          withCredentials: true,
          headers: { Cookie: cookie }
        });

        if (producto_response.status !== 200) throw new Error("Producto no válido.");
      }
    } catch (err) {
      const status = err.response?.status || 500;
      const message = err.response?.data?.message || err.message;
      const error = new Error(message);
      error.status = status;
      throw error;
    }
  }

  async addToCart(req, res) {
    const { user_id, product_id, cantidad } = req.body;

    if (!user_id || !product_id || cantidad === undefined) {
      return res.status(400).send({
        success: false,
        message: "Los campos user_id, product_id y cantidad son obligatorios.",
      });
    }

    try {
      await this.verifyUserAndProduct(user_id, product_id, req.headers.cookie);

      const existente = await Cart.findOne({ where: { user_id, product_id } });
      if (existente) {
        existente.cantidad += cantidad;
        await existente.save();
        return res.status(200).send({
          success: true,
          message: "Cantidad actualizada en el carrito.",
          data: existente,
        });
      }

      const nuevo = await Cart.create({ user_id, product_id, cantidad });
      res.status(201).send({
        success: true,
        message: "Producto agregado al carrito.",
        data: nuevo,
      });

    } catch (err) {
      res.status(err.status || 500).send({
        success: false,
        message: err.message,
      });
    }
  }

  async getCartByUser(req, res) {
    const user_id = req.params.user_id;

    try {
      await this.verifyUserAndProduct(user_id, null, req.headers.cookie);

      const items = await Cart.findAll({ where: { user_id } });

      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const producto_response = await axios.get(`${PRODUCT_SERVICE}/producto-service/producto/${item.product_id}`, {
              withCredentials: true,
              headers: { Cookie: req.headers.cookie }
            });

            return {
              ...item.dataValues,
              producto: producto_response.data
            };
          } catch {
            return {
              ...item.dataValues,
              producto: null,
              error: "Producto no encontrado"
            };
          }
        })
      );
      res.status(200).send({
        success: true,
        message: "Carrito obtenido.",
        data: enrichedItems,
      });

    } catch (err) {
      res.status(err.status || 500).send({
        success: false,
        message: err.message,
      });
    }
  }

  async updateCartItem(req, res) {
    const { user_id, product_id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad < 1) {
      return res.status(400).send({
        success: false,
        message: "Cantidad inválida.",
      });
    }

    try {
      const item = await Cart.findOne({ where: { user_id, product_id } });

      if (!item) {
        return res.status(404).send({
          success: false,
          message: "Producto no encontrado en el carrito.",
        });
      }

      item.cantidad = cantidad;
      await item.save();

      res.send({
        success: true,
        message: "Cantidad actualizada.",
        data: item,
      });

    } catch (err) {
      res.status(500).send({
        success: false,
        message: "Error al actualizar el carrito.",
        error: err.message,
      });
    }
  }

  async removeFromCart(req, res) {
    const { user_id, product_id } = req.params;

    try {
      const deleted = await Cart.destroy({ where: { user_id, product_id } });

      if (deleted === 1) {
        res.send({
          success: true,
          message: "Producto eliminado del carrito.",
        });
      } else {
        res.status(404).send({
          success: false,
          message: "Producto no encontrado en el carrito.",
        });
      }

    } catch (err) {
      res.status(500).send({
        success: false,
        message: `Error al eliminar del carrito. ${err}`,
        error: err.message,
      });
    }
  }

  async clearCart(req, res) {
    const user_id = req.params.user_id;
    try {
      const deleted = await Cart.destroy({ where: { user_id } });

      return res.status(200).send({
        success: true,
        data: { deleted },
        message: `${deleted} producto(s) eliminado(s) del carrito.`,
      });
    } catch (err) {
      res.status(500).send({
        success: false,
        message: "Error al vaciar el carrito.",
        error: err.message,
      });
    }
  }
}

module.exports = CartController;
