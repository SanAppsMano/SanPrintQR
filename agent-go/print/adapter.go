package print

type Adapter interface {
	Print(filePath, printerName string) error
}

func New() Adapter {
	return newAdapter()
}
