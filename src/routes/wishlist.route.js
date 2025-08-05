const express = require('express');
const WishlistController = require('../controllers/wishlist.controller.js');

class WishlistRoute {
  constructor(app) {
    this.router = express.Router();
    this.controller = new WishlistController();
    this.registerRoutes();
    app.use("/cart-wishlist-service/wishlist", this.router);
  }

  registerRoutes() {
    // Agregar producto a la wishlist
    this.router.post("/", (req, res) => {
      try {
        this.controller.addToWishlist(req, res);
      } catch (err) {
        console.error("Error en la ruta POST /wishlist:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Obtener wishlist de un usuario
    this.router.get("/:user_id", (req, res) => {
      try {
        this.controller.getWishlistByUser(req, res);
      } catch (err) {
        console.error("Error en la ruta GET /wishlist/:user_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Eliminar producto de la wishlist
    this.router.delete("/:user_id/:product_id", (req, res) => {
      try {
        this.controller.removeFromWishlist(req, res);
      } catch (err) {
        console.error("Error en la ruta DELETE /wishlist/:user_id/:product_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });

    // Vaciar toda la wishlist del usuario
    this.router.delete("/clear/:user_id", (req, res) => {
      try {
        this.controller.clearWishlist(req, res);
      } catch (err) {
        console.error("Error en la ruta DELETE /wishlist/clear/:user_id:", err);
        res.status(500).json({ error: "Error en el servidor" });
      }
    });
  }
}

module.exports = WishlistRoute;
