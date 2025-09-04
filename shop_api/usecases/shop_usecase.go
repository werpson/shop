package usecases

import (
	"github.com/werpson/shop/entities"
)

type ShopUseCase interface {
	SelectShop(shop entities.Shop) ([]entities.Shop, error)
	InsertShop(shop entities.Shop) error
	UpdateShop(shop entities.Shop) error
	DeleteShop(shopID int) error
}

type AuthShopUseCase interface {
	Login(shop entities.Shop) (AuthShopRepository, error)
}

type ShopService struct {
	repo ShopRepository
}

func NewShopService(repo ShopRepository) ShopUseCase {
	return &ShopService{repo: repo}
}

type ShopServiceLogin struct {
	repo ShopRepository
}

func NewShopServiceLogin(repo ShopRepository) AuthShopUseCase {
	return &ShopServiceLogin{repo: repo}
}

func (s *ShopService) SelectShop(shop entities.Shop) ([]entities.Shop, error) {
	return s.repo.Select(shop)
}

func (s *ShopService) InsertShop(shop entities.Shop) error {
	return s.repo.Insert(shop)
}

func (s *ShopService) UpdateShop(shop entities.Shop) error {
	return s.repo.Update(shop)
}

func (s *ShopService) DeleteShop(shopID int) error {
	return s.repo.Delete(shopID)
}

func (s *ShopServiceLogin) Login(shop entities.Shop) (AuthShopRepository, error) {
	authShop, err := s.repo.Login(shop)
	if err != nil {
		return AuthShopRepository{}, err
	}
	return authShop, nil
}
