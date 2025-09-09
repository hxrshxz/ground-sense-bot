package websocket

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
