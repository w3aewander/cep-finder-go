package main

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
)

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (f roundTripperFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func clientWithResponse(body string) *http.Client {
	return &http.Client{Transport: roundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader(body)),
			Header:     make(http.Header),
			Request:    req,
		}, nil
	})}
}

func TestLookupCEPFound(t *testing.T) {
	client := clientWithResponse(`{"cep":"01001-000","logradouro":"Praça da Sé","bairro":"Sé","localidade":"São Paulo","uf":"SP","ddd":"11"}`)

	address, err := lookupCEP(context.Background(), client, "01001000")
	if err != nil {
		t.Fatalf("lookupCEP returned an error: %v", err)
	}
	if address.CEP != "01001-000" || address.Cidade != "São Paulo" || address.Estado != "SP" {
		t.Fatalf("unexpected address: %#v", address)
	}
}

func TestLookupCEPNotFound(t *testing.T) {
	client := clientWithResponse(`{"erro":"true"}`)

	_, err := lookupCEP(context.Background(), client, "00000000")
	if !errors.Is(err, errNotFound) {
		t.Fatalf("expected errNotFound, got %v", err)
	}
}
