package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/werpson/shop/entities"
)

func GenerateShopJWT(authShop *entities.Shop) (string, error) {
	if authShop == nil {
		return "", fmt.Errorf("invalid shop data")
	}
	if authShop.ID == 0 || authShop.Shop_name == "" {
		return "", fmt.Errorf("Shop ID and name are required")
	}
	secret := "mysecretkey" // ควรเก็บใน env จริง
	claims := jwt.MapClaims{
		"shop_id":   authShop.ID,
		"shop_name": authShop.Shop_name,
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("Token generation failed: %v", err)
	}
	return tokenString, nil
}

func GenerateUserJWT(authUser *entities.User) (string, error) {
	if authUser == nil {
		return "", fmt.Errorf("invalid shop data")
	}
	if authUser.ID == 0 || authUser.Shop_id == 0 {
		return "", fmt.Errorf("Shop ID and name are required")
	}
	secret := "mysecretkey" // ควรเก็บใน env จริง
	claims := jwt.MapClaims{
		"user_id":    authUser.ID,
		"shop_id":    authUser.Shop_id,
		"permission": authUser.Permission,
		"exp":        time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("Token generation failed: %v", err)
	}
	return tokenString, nil
}
