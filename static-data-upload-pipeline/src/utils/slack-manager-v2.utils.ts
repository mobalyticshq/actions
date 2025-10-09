// Message line structure
export interface MessageLine {
  id: string;
  content: string;
  emoji?: string;
}

// Slack message manager V2 for structured message updates
export class SlackMessageManagerV2 {
  private currentMessageId: string | null = null;
  private currentLines: MessageLine[] = [];
  private channel: string = process.env.SLACK_CHANNEL_ID || 'C0932450HEF';

  /**
   * Send a new message to Slack
   * @param lines - Array of message lines to send
   * @param iconEmoji - Emoji to use as message icon
   */
  async sendMessage(lines: MessageLine[], iconEmoji = ':receipt:'): Promise<void> {
    // Store lines
    this.currentLines = [...lines];

    // Skip Slack API call if token is not provided (dry-run mode)
    if (!process.env.SLACK_BOT_TOKEN_V2) {
      this.currentMessageId = 'dry-run-message-id';
      return;
    }

    try {
      const messageText = this.formatLines(lines);
      
      const payload = {
        channel: this.channel,
        text: messageText,
        username: 'Static Data Pipeline',
        icon_emoji: iconEmoji,
        link_names: true,
      };

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN_V2}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as any;

      if (result.ok && result.ts) {
        // Store message ID for future updates
        this.currentMessageId = result.ts;
      }
    } catch (error) {
      // API call failed - message ID remains null
    }
  }

  /**
   * Update a specific line in the current message
   * @param lineId - ID of the line to update
   * @param content - New content for the line
   * @param emoji - Optional new emoji for the line
   * @param iconEmoji - Emoji to use as message icon
   * @returns true if successful, false otherwise
   */
  async updateMessage(
    lineId: string,
    content: string,
    emoji?: string,
    iconEmoji = ':receipt:'
  ): Promise<boolean> {
    // Check if message exists
    if (!this.currentMessageId) {
      return false;
    }

    // Find and update the specific line
    const lineIndex = this.currentLines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) {
      // Line not found
      return false;
    }

    // Update the line (preserve emoji if not provided)
    this.currentLines[lineIndex] = {
      id: lineId,
      content,
      emoji: emoji !== undefined ? emoji : this.currentLines[lineIndex].emoji,
    };

    // Send update to Slack
    return await this.sendUpdate(iconEmoji);
  }

  /**
   * Append a new line to the current message
   * @param line - New line to append
   * @param iconEmoji - Emoji to use as message icon
   * @returns true if successful, false otherwise
   */
  async appendNewLine(
    line: MessageLine,
    iconEmoji = ':receipt:'
  ): Promise<boolean> {
    // Check if message exists
    if (!this.currentMessageId) {
      return false;
    }

    // Append new line
    this.currentLines.push(line);

    // Send update to Slack
    return await this.sendUpdate(iconEmoji);
  }

  /**
   * Send update to Slack API
   */
  private async sendUpdate(iconEmoji: string): Promise<boolean> {
    // Skip Slack API call if token is not provided (dry-run mode)
    if (!process.env.SLACK_BOT_TOKEN_V2) {
      return true;
    }

    if (!this.currentMessageId) {
      return false;
    }

    try {
      const messageText = this.formatLines(this.currentLines);
      
      const payload = {
        channel: this.channel,
        ts: this.currentMessageId,
        text: messageText,
        username: 'Static Data Pipeline',
        icon_emoji: iconEmoji,
        link_names: true,
      };

      const response = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN_V2}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as any;

      // Return success/failure status
      return result.ok;
    } catch (error) {
      // API call failed
      return false;
    }
  }

  /**
   * Format message lines into a single string
   */
  private formatLines(lines: MessageLine[]): string {
    return lines
      .map(line => {
        const emoji = line.emoji ? `${line.emoji} ` : '';
        return `${emoji}${line.content}`;
      })
      .join('\n');
  }

  /**
   * Get current lines of the message
   */
  getMessageLines(): MessageLine[] {
    return [...this.currentLines];
  }

  /**
   * Get current message ID
   */
  getMessageId(): string | null {
    return this.currentMessageId;
  }

  /**
   * Clear stored message state
   */
  reset() {
    this.currentMessageId = null;
    this.currentLines = [];
  }
}

