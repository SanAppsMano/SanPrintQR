//go:build !windows

package print

import "fmt"

type posixAdapter struct{}

func newAdapter() Adapter { return &posixAdapter{} }

func (a *posixAdapter) Print(filePath, printerName string) error {
	fmt.Println("Simulating POSIX print", filePath, "to", printerName)
	// TODO: implement real POSIX spooler
	return nil
}
