package usecases

import (
	"github.com/werpson/shop/entities"
)

type AuthShopRepository struct {
	Shop       entities.Shop `json:"shop"`
	Token_shop string        `json:"token_shop"`
}

type ShopRepository interface {
	Select(shop entities.Shop) ([]entities.Shop, error)
	Insert(shop entities.Shop) error
	Update(shop entities.Shop) error
	Delete(shopID int) error
	Login(shop entities.Shop) (AuthShopRepository, error)
}
