package usecases

import (
	"github.com/werpson/shop/entities"
)

type UserUseCase interface {
	SelectUser(user entities.User) ([]entities.User, error)
	InsertUser(user entities.User) error
	UpdateUser(user entities.User) error
	DeleteUser(user entities.User) error
}

type AuthUserUseCase interface {
	Login(user entities.User) (AuthUserRepository, error)
}

type UserService struct {
	repo UserRepository
}

type AuthUserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) UserUseCase {
	return &UserService{repo: repo}
}

func NewAuthUserService(repo UserRepository) AuthUserUseCase {
	return &AuthUserService{repo: repo}
}

func (s *UserService) SelectUser(user entities.User) ([]entities.User, error) {
	return s.repo.Select(user)
}

func (s *UserService) InsertUser(user entities.User) error {
	return s.repo.Insert(user)
}

func (s *UserService) UpdateUser(user entities.User) error {
	return s.repo.Update(user)
}

func (s *UserService) DeleteUser(user entities.User) error {
	return s.repo.Delete(user)
}

func (s *AuthUserService) Login(user entities.User) (AuthUserRepository, error) {
	authUser, err := s.repo.Login(user)
	if err != nil {
		return AuthUserRepository{}, err
	}
	return authUser, nil
}
