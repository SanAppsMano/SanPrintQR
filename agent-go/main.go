package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"agent/print"
)

type Config struct {
	AgentId        string `json:"agentId"`
	AgentSecret    string `json:"agentSecret"`
	ApiBaseUrl     string `json:"apiBaseUrl"`
	Platform       string `json:"platform"`
	InboxDir       string `json:"inboxDir"`
	ProcessedDir   string `json:"processedDir"`
	DefaultPrinter string `json:"defaultPrinterName"`
}

func loadConfig() Config {
	data, err := os.ReadFile("config.json")
	if err != nil {
		data, err = os.ReadFile("config.example.json")
		if err != nil {
			log.Fatal(err)
		}
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		log.Fatal(err)
	}
	return cfg
}

func watchInbox(cfg Config) {
	for {
		entries, err := os.ReadDir(cfg.InboxDir)
		if err == nil {
			for _, e := range entries {
				name := e.Name()
				if strings.HasSuffix(strings.ToLower(name), ".pdf") {
					processFile(cfg, name)
				}
			}
		}
		time.Sleep(2 * time.Second)
	}
}

func processFile(cfg Config, name string) {
	srcPath := filepath.Join(cfg.InboxDir, name)
	base := strings.TrimSuffix(name, filepath.Ext(name))
	metaPath := filepath.Join(cfg.InboxDir, base+".meta.json")
	meta := struct {
		UID   string `json:"uid"`
		Pages int    `json:"pages"`
	}{}
	if data, err := os.ReadFile(metaPath); err == nil {
		json.Unmarshal(data, &meta)
	}
	uid := meta.UID
	if uid == "" {
		uid = "demo-user"
	}
	pages := meta.Pages
	if pages == 0 {
		pages = 1
	}
	os.MkdirAll(cfg.ProcessedDir, 0755)
	destPath := filepath.Join(cfg.ProcessedDir, name)
	os.Rename(srcPath, destPath)
	body := map[string]any{
		"filename": name,
		"pages":    pages,
		"filePath": destPath,
	}
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", cfg.ApiBaseUrl+"/api/upload", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-uid", uid)
	if _, err := http.DefaultClient.Do(req); err != nil {
		log.Println("upload", err)
	}
	os.Remove(metaPath)
}

type Command struct {
	Cmd         string `json:"cmd"`
	JobId       string `json:"jobId"`
	FilePath    string `json:"filePath"`
	PrinterName string `json:"printerName"`
}

func pollOnce(cfg Config) *Command {
	req, _ := http.NewRequest("POST", cfg.ApiBaseUrl+"/api/agent/poll", nil)
	req.Header.Set("x-agent-id", cfg.AgentId)
	req.Header.Set("x-agent-secret", cfg.AgentSecret)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("poll", err)
		return nil
	}
	defer res.Body.Close()
	var data struct {
		Cmd *Command `json:"cmd"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		log.Println("decode", err)
		return nil
	}
	return data.Cmd
}

func handlePrint(cfg Config, adapter print.Adapter, c *Command) {
	err := adapter.Print(c.FilePath, c.PrinterName)
	if err == nil {
		os.MkdirAll("printed", 0755)
		src, err1 := os.Open(c.FilePath)
		if err1 == nil {
			dst, err2 := os.Create(filepath.Join("printed", filepath.Base(c.FilePath)))
			if err2 == nil {
				io.Copy(dst, src)
				dst.Close()
			}
			src.Close()
		}
	}
	status := "printed"
	detail := ""
	if err != nil {
		status = "error"
		detail = err.Error()
	}
	body := map[string]any{"jobId": c.JobId, "status": status}
	if detail != "" {
		body["detail"] = detail
	}
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", cfg.ApiBaseUrl+"/api/agent/callback", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	if _, err := http.DefaultClient.Do(req); err != nil {
		log.Println("callback", err)
	}
}

func pollLoop(cfg Config, adapter print.Adapter) {
	for {
		cmd := pollOnce(cfg)
		if cmd != nil && cmd.Cmd == "PRINT" {
			handlePrint(cfg, adapter, cmd)
		}
		time.Sleep(2 * time.Second)
	}
}

func main() {
	cfg := loadConfig()
	adapter := print.New()
	go watchInbox(cfg)
	go pollLoop(cfg, adapter)
	select {}
}
