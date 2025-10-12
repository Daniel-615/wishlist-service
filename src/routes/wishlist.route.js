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
    this.router.post("/share/:userId",  (req,res)=>{
      this.controller.postUrlShare(req,res);
    })

    this.router.delete("/share/:userId",(req,res)=>{
      this.controller.revokeShareLink(req,res);
    })
    this.router.get("/shared/:shareId",(req,res)=>{
      this.controller.getSharedWishlistPublic(req,res);
    })
    // Agregar producto a la wishlist
    this.router.post("/", (req, res) => {
      try {
        this.controller.addToWishlist(req, res);
      } catch (err) {
        console.error("Error al agregar a la wishlist:  ",err)
      }
    });

    // Obtener wishlist de un usuario
    this.router.get("/:user_id", (req, res) => {
      try {
        this.controller.getWishlistByUser(req, res);
      } catch (err) {
        console.error("Error al agregar a la wishlist:  ",err)
      }
    });
      // Vaciar toda la wishlist del usuario
    this.router.delete("/clear/:user_id", (req, res) => {
      try {
        this.controller.clearWishlist(req, res);
      } catch (err) {
        console.error("Error al limpiar la wishlist del usuario:  ",err)
      }
    });
    // Eliminar producto de la wishlist
    this.router.delete("/:user_id/:producto_talla_color_id", (req, res) => {
      try {
        this.controller.removeFromWishlist(req, res);
      } catch (err) {
        console.error("Error al remover de la wishlist :  ",err)
      }
    });

  }
}

module.exports = WishlistRoute;
