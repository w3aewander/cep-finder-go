package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
)

var digitsOnly = regexp.MustCompile(`\D`)

type viacepResponse struct {
	CEP         string `json:"cep"`
	Logradouro  string `json:"logradouro"`
	Complemento string `json:"complemento"`
	Bairro      string `json:"bairro"`
	Localidade  string `json:"localidade"`
	UF          string `json:"uf"`
	DDD         string `json:"ddd"`
	Erro        string `json:"erro"`
}

type cepResponse struct {
	CEP         string `json:"cep"`
	Logradouro  string `json:"logradouro"`
	Complemento string `json:"complemento,omitempty"`
	Bairro      string `json:"bairro"`
	Cidade      string `json:"cidade"`
	Estado      string `json:"estado"`
	DDD         string `json:"ddd,omitempty"`
}

func main() {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), cors())

	client := &http.Client{Timeout: 8 * time.Second}
	router.GET("/api/cep/:cep", func(c *gin.Context) {
		cep := digitsOnly.ReplaceAllString(c.Param("cep"), "")
		if len(cep) != 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "CEP inválido. Informe os 8 dígitos do CEP."})
			return
		}

		address, err := lookupCEP(c.Request.Context(), client, cep)
		if err != nil {
			status := http.StatusBadGateway
			if errors.Is(err, errNotFound) {
				status = http.StatusNotFound
			}
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, address)
	})
	// Após `npm run build`, o Gin também entrega a interface React no mesmo servidor.
	router.Static("/assets", "./frontend/dist/assets")
	router.StaticFile("/", "./frontend/dist/index.html")

	fmt.Println("API disponível em http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}

var errNotFound = errors.New("Não encontramos um endereço para este CEP.")

func lookupCEP(ctx context.Context, client *http.Client, cep string) (cepResponse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://viacep.com.br/ws/"+cep+"/json/", nil)
	if err != nil {
		return cepResponse{}, errors.New("Não foi possível preparar a consulta do CEP.")
	}
	resp, err := client.Do(req)
	if err != nil {
		return cepResponse{}, errors.New("O serviço de CEP está indisponível. Tente novamente em instantes.")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return cepResponse{}, errors.New("O serviço de CEP não respondeu como esperado.")
	}

	var data viacepResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return cepResponse{}, errors.New("Não foi possível interpretar a resposta do serviço de CEP.")
	}
	if data.Erro == "true" {
		return cepResponse{}, errNotFound
	}
	return cepResponse{
		CEP: data.CEP, Logradouro: data.Logradouro, Complemento: data.Complemento,
		Bairro: data.Bairro, Cidade: data.Localidade, Estado: data.UF, DDD: data.DDD,
	}, nil
}

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
