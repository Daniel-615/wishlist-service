const { Model, DataTypes } = require('sequelize');

class Cart extends Model {}

module.exports = (sequelize) => {
  Cart.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'cart',
      tableName: 'carts',
      timestamps: false,
    }
  );
  return Cart;
};
