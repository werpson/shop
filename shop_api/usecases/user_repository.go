package usecases

import (
	"github.com/werpson/shop/entities"
)

type AuthUserRepository struct {
	User       entities.User `json:"user"`
	Token_User string        `json:"token_user"`
}

type UserRepository interface {
	Select(user entities.User) ([]entities.User, error)
	Insert(user entities.User) error
	Update(user entities.User) error
	Delete(user entities.User) error
	Login(user entities.User) (AuthUserRepository, error)
}
