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
        console.error("Error en la ruta DELETE /cart/clear/:user_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Agregar producto al carrito
    this.router.post("/", (req, res) => {
      try {
        this.controller.addToCart(req, res);
      } catch (err) {
        console.error("Error en la ruta POST /cart:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Obtener carrito de un usuario
    this.router.get("/:user_id", (req, res) => {
      try {
        this.controller.getCartByUser(req, res);
      } catch (err) {
        console.error("Error en la ruta GET /cart/:user_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Actualizar cantidad de producto en el carrito
    this.router.put("/:user_id/:product_id", (req, res) => {
      try {
        this.controller.updateCartItem(req, res);
      } catch (err) {
        console.error("Error en la ruta PUT /cart/:user_id/:product_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Eliminar producto específico del carrito
    this.router.delete("/:user_id/:product_id", (req, res) => {
      try {
        this.controller.removeFromCart(req, res);
      } catch (err) {
        console.error("Error en la ruta DELETE /cart/:user_id/:product_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });
  }
}

module.exports = CartRoute;
