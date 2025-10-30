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
    /**
     * @openapi
     * tags:
     *   - name: Wishlist
     *     description: Gestión de listas de deseos y enlaces compartidos
     */

    /**
     * @openapi
     * /wishlist/share/{userId}:
     *   post:
     *     summary: Generar/renovar enlace público de la wishlist
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: "string", example: "a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f" }
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/ShareLinkRequest' }
     *     responses:
     *       200:
     *         description: Link generado
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/ShareLinkResponse' }
     */
    this.router.post("/share/:userId", (req, res) => this.controller.postUrlShare(req, res));

    /**
     * @openapi
     * /wishlist/share/{userId}:
     *   delete:
     *     summary: Revocar enlace público actual
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema: { type: "string" }
     *     responses:
     *       200:
     *         description: Enlace revocado
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 success: { type: "boolean", example: true }
     *                 message: { type: "string", example: "Enlace revocado." }
     */
    this.router.delete("/share/:userId", (req, res) => this.controller.revokeShareLink(req, res));

    /**
     * @openapi
     * /wishlist/shared/{shareId}:
     *   get:
     *     summary: Obtener la wishlist pública por shareId
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: shareId
     *         required: true
     *         schema: { type: "string", example: "WL-abc123xyz" }
     *     responses:
     *       200:
     *         description: Lista pública obtenida
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/SharedWishlistResponse' }
     */
    this.router.get("/shared/:shareId", (req, res) => this.controller.getSharedWishlistPublic(req, res));

    /**
     * @openapi
     * /wishlist:
     *   post:
     *     summary: Agregar un producto a la wishlist
     *     tags: [Wishlist]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: { $ref: '#/components/schemas/AddToWishlistDto' }
     *     responses:
     *       201:
     *         description: Agregado a wishlist
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 message: { type: "string", example: "Producto agregado a la wishlist." }
     *                 wishlist: { $ref: '#/components/schemas/WishlistItem' }
     */
    this.router.post("/", (req, res) => this.controller.addToWishlist(req, res));

    /**
     * @openapi
     * /wishlist/{user_id}:
     *   get:
     *     summary: Obtener la wishlist privada
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string" }
     *     responses:
     *       200:
     *         description: Wishlist obtenida
     *         content:
     *           application/json:
     *             schema:
     *               type: "array"
     *               items: { $ref: '#/components/schemas/WishlistEnrichedItem' }
     */
    this.router.get("/:user_id", (req, res) => this.controller.getWishlistByUser(req, res));

    /**
     * @openapi
     * /wishlist/clear/{user_id}:
     *   delete:
     *     summary: Vaciar la wishlist del usuario
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string" }
     *     responses:
     *       200:
     *         description: Wishlist vaciada
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 message: { type: "string", example: "3 producto(s) eliminado(s) de la wishlist." }
     */
    this.router.delete("/clear/:user_id", (req, res) => this.controller.clearWishlist(req, res));

    /**
     * @openapi
     * /wishlist/{user_id}/{producto_talla_color_id}:
     *   delete:
     *     summary: Eliminar un producto de la wishlist
     *     tags: [Wishlist]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string" }
     *       - in: path
     *         name: producto_talla_color_id
     *         required: true
     *         schema: { type: "integer", example: 123 }
     *     responses:
     *       200:
     *         description: Producto eliminado
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 message: { type: "string", example: "Producto eliminado de la wishlist." }
     */
    this.router.delete("/:user_id/:producto_talla_color_id", (req, res) => this.controller.removeFromWishlist(req, res));
  }
}

module.exports = WishlistRoute;
