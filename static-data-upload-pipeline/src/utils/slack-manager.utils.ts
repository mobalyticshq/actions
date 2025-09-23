// Slack message manager for updating messages
export class SlackMessageManager {
  private messageTs: string | null = null;
  private messageHistory: string[] = [];
  // private channel: string = '#notifications-static-data-pipeline';
  private channel: string = process.env.SLACK_CHANNEL_ID || 'C09GRKW59EY';

  async sendOrUpdate(message: string, iconEmoji = ':receipt:', isUpdate = false, shouldUpdatePrevious = false) {
    if (!process.env.SLACK_BOT_TOKEN_V2) {
      console.log('📢 Slack notification:', message);
      return;
    }

    try {
      if (isUpdate && this.messageTs) {
        // Update previous message to mark as completed
        if (this.messageHistory.length > 0 && shouldUpdatePrevious) {
          const lastMessage = this.messageHistory[this.messageHistory.length - 1];
          // Replace the first emoji with white_check_mark, but avoid duplication
          const completedMessage = lastMessage.split(' ').slice(1).join(' ');
          this.messageHistory[this.messageHistory.length - 1] = `:white_check_mark: ${completedMessage}`;
        }

        this.messageHistory.push(`${iconEmoji} ${message}`);

        // Update the message with merged content
        const mergedMessage = this.messageHistory.join('\n');
        await this.updateMessage(mergedMessage, ':receipt:');
      } else {
        // Send new message and add to history
        this.messageHistory = [`${iconEmoji} ${message}`];
        await this.sendNewMessage(message, iconEmoji);
      }
    } catch (error) {
      console.error('❌ Slack API error:', error);
    }
  }

  private async sendNewMessage(message: string, iconEmoji: string) {
    const payload = {
      channel: this.channel,
      text: message,
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
      this.messageTs = result.ts;
      console.log('✅ Message sent successfully, timestamp:', this.messageTs);
    } else {
      console.error('❌ Failed to send Slack message:', result.error);
    }
  }

  private async updateMessage(message: string, iconEmoji: string) {
    const payload = {
      channel: this.channel,
      ts: this.messageTs,
      text: message,
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

    if (!result.ok) {
      console.error('❌ Failed to update Slack message:', result.error);
    }
  }

  reset() {
    this.messageTs = null;
    this.messageHistory = [];
  }
}
