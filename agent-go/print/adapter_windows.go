//go:build windows

package print

import "fmt"

type winAdapter struct{}

func newAdapter() Adapter { return &winAdapter{} }

func (a *winAdapter) Print(filePath, printerName string) error {
	fmt.Println("Simulating Windows print", filePath, "to", printerName)
	// TODO: implement real Windows spooler
	return nil
}
