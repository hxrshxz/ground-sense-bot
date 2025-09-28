package models

import (
	"time"
	"github.com/google/uuid"
)

type Message struct {
	ID             uuid.UUID     `json:"id" db:"id"`
	ConversationID uuid.UUID     `json:"conversation_id" db:"conversation_id"`
	SenderID       uuid.UUID     `json:"sender_id" db:"sender_id"`
	Content        string        `json:"content" db:"content" validate:"required,max=2000"`
	MessageType    MessageType   `json:"message_type" db:"message_type"`
	Status         MessageStatus `json:"status" db:"status"`
	ReplyToID      *uuid.UUID    `json:"reply_to_id,omitempty" db:"reply_to_id"`
	Attachments    []Attachment  `json:"attachments,omitempty" db:"attachments"`
	Metadata       MessageMetadata `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
	DeletedAt      *time.Time    `json:"deleted_at,omitempty" db:"deleted_at"`

	// Populated fields (not in DB)
	Sender         *User         `json:"sender,omitempty" db:"-"`
	Conversation   *Conversation `json:"conversation,omitempty" db:"-"`
	Reactions      []Reaction    `json:"reactions,omitempty" db:"-"`
}

type MessageType string

const (
	MessageTypeText     MessageType = "text"
	MessageTypeImage    MessageType = "image"
	MessageTypeFile     MessageType = "file"
	MessageTypeAudio    MessageType = "audio"
	MessageTypeVideo    MessageType = "video"
	MessageTypeSystem   MessageType = "system"
	MessageTypeLocation MessageType = "location"
)

type MessageStatus string

const (
	MessageStatusSent     MessageStatus = "sent"
	MessageStatusDelivered MessageStatus = "delivered"
	MessageStatusRead     MessageStatus = "read"
	MessageStatusFailed   MessageStatus = "failed"
)

type MessageMetadata struct {
	Edited     bool      `json:"edited,omitempty"`
	EditedAt   *time.Time `json:"edited_at,omitempty"`
	Forwarded  bool      `json:"forwarded,omitempty"`
	ForwardedFrom *uuid.UUID `json:"forwarded_from,omitempty"`
	MentionedUsers []uuid.UUID `json:"mentioned_users,omitempty"`
	Hashtags   []string  `json:"hashtags,omitempty"`
	URLs       []string  `json:"urls,omitempty"`
}

type Attachment struct {
	ID          uuid.UUID `json:"id"`
	FileName    string    `json:"file_name"`
	FileSize    int64     `json:"file_size"`
	MimeType    string    `json:"mime_type"`
	URL         string    `json:"url"`
	ThumbnailURL string   `json:"thumbnail_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Reaction struct {
	ID       uuid.UUID `json:"id"`
	UserID   uuid.UUID `json:"user_id"`
	Emoji    string    `json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
	User     *User     `json:"user,omitempty"`
}

type Conversation struct {
	ID             uuid.UUID           `json:"id" db:"id"`
	Type           ConversationType    `json:"type" db:"type"`
	Name           string              `json:"name,omitempty" db:"name"`
	Description    string              `json:"description,omitempty" db:"description"`
	AvatarURL      string              `json:"avatar_url,omitempty" db:"avatar_url"`
	CreatedBy      uuid.UUID           `json:"created_by" db:"created_by"`
	IsGroup        bool                `json:"is_group" db:"is_group"`
	Participants   []ConversationParticipant `json:"participants,omitempty" db:"participants"`
	LastMessage    *Message            `json:"last_message,omitempty" db:"-"`
	LastActivityAt time.Time           `json:"last_activity_at" db:"last_activity_at"`
	CreatedAt      time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at" db:"updated_at"`
}

type ConversationType string

const (
	ConversationTypeDirect ConversationType = "direct"
	ConversationTypeGroup  ConversationType = "group"
	ConversationTypeChannel ConversationType = "channel"
)

type ConversationParticipant struct {
	ID             uuid.UUID              `json:"id" db:"id"`
	ConversationID uuid.UUID              `json:"conversation_id" db:"conversation_id"`
	UserID         uuid.UUID              `json:"user_id" db:"user_id"`
	Role           ParticipantRole        `json:"role" db:"role"`
	JoinedAt       time.Time              `json:"joined_at" db:"joined_at"`
	LastReadAt     *time.Time             `json:"last_read_at,omitempty" db:"last_read_at"`
	IsMuted        bool                   `json:"is_muted" db:"is_muted"`
	User           *User                  `json:"user,omitempty" db:"-"`
}

type ParticipantRole string

const (
	ParticipantRoleMember  ParticipantRole = "member"
	ParticipantRoleAdmin   ParticipantRole = "admin"
	ParticipantRoleOwner   ParticipantRole = "owner"
)

type SendMessageRequest struct {
	ConversationID uuid.UUID     `json:"conversation_id" validate:"required"`
	Content        string        `json:"content" validate:"required,max=2000"`
	MessageType    MessageType   `json:"message_type,omitempty"`
	ReplyToID      *uuid.UUID    `json:"reply_to_id,omitempty"`
	Attachments    []Attachment  `json:"attachments,omitempty"`
}

type CreateConversationRequest struct {
	Type        ConversationType `json:"type" validate:"required"`
	Name        string           `json:"name,omitempty" validate:"required_if=Type group"`
	Description string           `json:"description,omitempty"`
	ParticipantIDs []uuid.UUID   `json:"participant_ids" validate:"required,min=1"`
}

type UpdateConversationRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	AvatarURL   *string `json:"avatar_url,omitempty"`
}

type MessageResponse struct {
	Message      *Message `json:"message"`
	Conversation *Conversation `json:"conversation,omitempty"`
}

type ConversationResponse struct {
	Conversation *Conversation `json:"conversation"`
	Messages     []Message     `json:"messages,omitempty"`
	HasMore      bool          `json:"has_more"`
}
