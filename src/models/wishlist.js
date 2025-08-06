const { Model, DataTypes } = require('sequelize');

class Wishlist extends Model {}

module.exports = (sequelize) => {
  Wishlist.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'wishlist',
      tableName: 'wishlists',
      timestamps: false,
    }
  );
  return Wishlist;
};
