package usecases

import (
	"github.com/werpson/shop/entities"
)

type ProductUsecase interface {
	SelectProduct(product entities.Product) ([]entities.Product, error)
	InsertProduct(product entities.Product, product_history entities.ProductHistory) error
	UpdateProduct(product entities.Product, product_history entities.ProductHistory) error
	DeleteProduct(product entities.Product, product_history entities.ProductHistory) error
}

type ProductService struct {
	repo ProductRepository
}

func NewProductService(repo ProductRepository) ProductUsecase {
	return &ProductService{repo: repo}
}

func (s ProductService) SelectProduct(product entities.Product) ([]entities.Product, error) {
	return s.repo.Select(product)
}

func (s ProductService) InsertProduct(product entities.Product, product_history entities.ProductHistory) error {
	return s.repo.Insert(product, product_history)
}

func (s ProductService) UpdateProduct(product entities.Product, product_history entities.ProductHistory) error {
	return s.repo.Update(product, product_history)
}

func (s ProductService) DeleteProduct(product entities.Product, product_history entities.ProductHistory) error {
	return s.repo.Delete(product, product_history)
}
