package usecases

import (
	"github.com/werpson/shop/entities"
)

type ProductHistoryUseCase interface {
	SelectProductHistory(productHistory entities.ProductHistory, product entities.Product, user entities.User, month int, year int) ([]entities.ProductHistory, []entities.Product, []entities.User, error)
	SelectTopOut(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error)
	SelectTopIn(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error)
}

type ProductHistoryService struct {
	repo ProductHistoryRepository
}

func NewProductHistoryService(repo ProductHistoryRepository) *ProductHistoryService {
	return &ProductHistoryService{repo: repo}
}

func (s *ProductHistoryService) SelectProductHistory(productHistory entities.ProductHistory, product entities.Product, user entities.User, month int, year int) ([]entities.ProductHistory, []entities.Product, []entities.User, error) {
	return s.repo.Select(productHistory, product, user, month, year)
}

func (s *ProductHistoryService) SelectTopOut(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error) {
	return s.repo.SelectTopOut(product, month, year)
}

func (s *ProductHistoryService) SelectTopIn(product entities.Product, month int, year int) ([]entities.Product, []entities.ProductHistory, error) {
	return s.repo.SelectTopIn(product, month, year)
}
