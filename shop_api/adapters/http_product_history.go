package adapters

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/werpson/shop/auth"
	"github.com/werpson/shop/entities"
	"github.com/werpson/shop/usecases"
)

type HttpProductHistoryHandler struct {
	productHistoryUseCase usecases.ProductHistoryUseCase
}

func NewHttpProductHistoryHandler(useCase usecases.ProductHistoryUseCase) *HttpProductHistoryHandler {
	return &HttpProductHistoryHandler{productHistoryUseCase: useCase}
}

func (h *HttpProductHistoryHandler) GetProductHistory(c *fiber.Ctx) error {
	var user entities.User
	var productHistory entities.ProductHistory
	if err := c.QueryParser(&productHistory); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	var product entities.Product
	product_shopId, err := auth.GetShopIDFromUserJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	product.Shop_id = product_shopId

	monthStr := c.Query("month")
	yearStr := c.Query("year")

	var month, year int

	if monthStr != "" && yearStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid month"})
		}
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid year"})
		}
	} else {
		month = 0
		year = 0
	}

	productHistories, products, users, err := h.productHistoryUseCase.SelectProductHistory(productHistory, product, user, month, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"product_histories": productHistories,
		"products":          products,
		"users":             users,
	})
}

func (h *HttpProductHistoryHandler) GetTopOutProductHistory(c *fiber.Ctx) error {
	var product entities.Product
	product_shopId, err := auth.GetShopIDFromUserJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	product.Shop_id = product_shopId

	monthStr := c.Query("month")
	yearStr := c.Query("year")

	var month, year int

	if monthStr != "" && yearStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid month"})
		}
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid year"})
		}
	} else {
		month = 0
		year = 0
	}

	products, productHistories, err := h.productHistoryUseCase.SelectTopOut(product, month, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"products":          products,
		"product_histories": productHistories,
	})
}

func (h *HttpProductHistoryHandler) GetTopInProductHistory(c *fiber.Ctx) error {
	var product entities.Product
	product_shopId, err := auth.GetShopIDFromUserJWT(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	product.Shop_id = product_shopId

	monthStr := c.Query("month")
	yearStr := c.Query("year")

	var month, year int

	if monthStr != "" && yearStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid month"})
		}
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid year"})
		}
	} else {
		month = 0
		year = 0
	}

	products, productHistories, err := h.productHistoryUseCase.SelectTopIn(product, month, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"products":          products,
		"product_histories": productHistories,
	})
}
