const express = require('express');
const CartController = require('../controllers/cart.controller');

class CartRoute {
  constructor(app) {
    this.router = express.Router();
    this.controller = new CartController();
    this.registerRoutes();
    app.use("/cart-wishlist-service/cart", this.router);
  }

  registerRoutes() {
    this.router.delete("/clear/:user_id", (req, res) => {
      try {
        this.controller.clearCart(req, res);
      } catch (err) {
        console.error("Error al limpiar el carrito del usuario:  ",err)
      }
    });

    // Agregar producto al carrito
    this.router.post("/", (req, res) => {
      try {
        this.controller.addToCart(req, res);
      } catch (err) {
        console.error("Error al agregar un producto al carrito:  ",err)
      }
    });

    // Obtener carrito de un usuario
    this.router.get("/:user_id", (req, res) => {
      try {
        this.controller.getCartByUser(req, res);
      } catch (err) {
        console.error("Error al obtener el carrito del usuario:  ",err)
      }
    });

    // Actualizar cantidad de producto en el carrito
    this.router.put("/:user_id/:producto_talla_color_id", (req, res) => {
      try {
        this.controller.updateCartItem(req, res);
        
      } catch (err) {
        console.error("Error al actualizar producto del carrito:  ",err.message)
      }
    });

    // Eliminar producto específico del carrito
    this.router.delete("/:user_id/:producto_talla_color_id", (req, res) => {
      try {
        this.controller.removeFromCart(req, res);
      } catch (err) {
        console.error("Error al eliminar productos del carrito:  ",err)
      }
    });
  }
}

module.exports = CartRoute;
