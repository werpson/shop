package auth

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("mysecretkey") // ควรเก็บใน env จริง

type JWTShopClaims struct {
	ShopID   int    `json:"shop_id"`
	ShopName string `json:"shop_name"`
	jwt.RegisteredClaims
}

type JWTUserClaims struct {
	UserID     int    `json:"user_id"`
	ShopID     int    `json:"shop_id"`
	Permission string `json:"permission"`
	jwt.RegisteredClaims
}

func ParseShopJWT(tokenString string) (*JWTShopClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTShopClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTShopClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrSignatureInvalid
}

func ParseUserJWT(tokenString string) (*JWTUserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTUserClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTUserClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrSignatureInvalid
}

func JWTValidateMiddleware(c *fiber.Ctx) error {
	token := c.Get("Authorization")
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
	}

	token = token[len("Bearer "):] // Remove "Bearer " prefix
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, err := ParseShopJWT(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	c.Locals("shop_id", claims.ShopID)
	c.Locals("shop_name", claims.ShopName)

	return c.Next()
}

func GetShopIDFromJWT(c *fiber.Ctx) (int, error) {
	token := c.Cookies("token_shop")
	if token == "" {
		token = c.Get("Authorization")
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
		}

		token = token[len("Bearer "):] // Remove "Bearer " prefix
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}
	}

	authShop, err := ParseShopJWT(token)
	if err != nil {
		return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return authShop.ShopID, nil
}

func GetUserIDFromJWT(c *fiber.Ctx) (int, error) {
	token := c.Cookies("token_user")
	if token == "" {
		token = c.Get("Authorization")
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
		}

		token = token[len("Bearer "):] // Remove "Bearer " prefix
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}
	}

	authUser, err := ParseUserJWT(token)
	if err != nil {
		return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return authUser.UserID, nil
}

func GetShopIDFromUserJWT(c *fiber.Ctx) (int, error) {
	token := c.Cookies("token_user")
	if token == "" {
		token = c.Get("Authorization")
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
		}

		token = token[len("Bearer "):] // Remove "Bearer " prefix
		if token == "" {
			return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}
	}

	if token == "" {
		return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
	}

	authUser, err := ParseUserJWT(token)
	if err != nil {
		return 0, c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return authUser.ShopID, nil
}

func GetUserPermissionJWT(c *fiber.Ctx) (string, error) {
	token := c.Cookies("token_user")
	if token == "" {
		token = c.Get("Authorization")
		if token == "" {
			return "", c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
		}

		token = token[len("Bearer "):] // Remove "Bearer " prefix
		if token == "" {
			return "", c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}
	}

	authUser, err := ParseUserJWT(token)
	if err != nil {
		return "", c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
	}

	return authUser.Permission, nil
}

func GetShopJWTCookie(c *fiber.Ctx) error {
	cookie := c.Cookies("token_shop")
	if cookie == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No JWT cookie found"})
	}
	return c.SendStatus(fiber.StatusOK)
}

func GetUserJWTCookie(c *fiber.Ctx) error {
	cookie := c.Cookies("token_user")
	if cookie == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No JWT cookie found"})
	}
	permission, err := GetUserPermissionJWT(c)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"permission": permission,
	})
}
