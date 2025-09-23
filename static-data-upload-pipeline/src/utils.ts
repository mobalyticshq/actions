import * as slugify_ from 'slugify';

export const initSlugify = () =>
  slugify_.default.extend({
    '+': '-plus-',
    '-': '-',
    '—': '-',
    '‐': '-',
    '*': '-',
    '/': '-',
    '%': '-',
    '&': '-and-',
    '|': '-',
    '^': '-',
    '~': '-',
    '!': '-',
    '@': '-',
    '#': '-',
    $: '-',
    '(': '-',
    ')': '-',
    '[': '-',
    ']': '-',
    '{': '-',
    '}': '-',
    '<': '-',
    '>': '-',
    '=': '-',
    '?': '-',
    ':': '-',
    ';': '-',
    ',': '-',
    '.': '-',
    '"': '-',
    "'": '',
    '\\': '-',
    ' ': '-',
  });

export function slugify(value: string) {
  return slugify_
    .default(value, {
      replacement: '-', // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: true, // convert to lower case, defaults to `false`
      strict: false, // strip special characters except replacement, defaults to `false`
      locale: 'vi', // language code of the locale to use
      trim: true, // trim leading and trailing replacement chars, defaults to `true`
    })
    .replace(/[-\u2012\u2013\u2014\u2015]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-+/g, '-');
}

export function isImage(val: string, prefix: string = 'https://') {
  if (!val || val === '') return false;
  return (
    val.startsWith(prefix) &&
    (val.endsWith('.avif') ||
      val.endsWith('.svg') ||
      val.endsWith('.gif') ||
      val.endsWith('.png') ||
      val.endsWith('.jpg') ||
      val.endsWith('.jpeg') ||
      val.endsWith('.webp'))
  );
}

export function stringify(value: any) {
  if (value instanceof Object) {
    return JSON.stringify(value);
  }
  return String(value);
}

export function tryParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {}
  return value;
}

// Slack message manager for updating messages
class SlackMessageManager {
  private messageTs: string | null = null;
  // private channel: string = '#notifications-static-data-pipeline';
  private channel: string = '#sd-pipeline-notification-test'

  async sendOrUpdate(message: string, iconEmoji = ':receipt:', isUpdate = false) {
    if (!process.env.SLACK_BOT_TOKEN_V2) {
      console.log('📢 Slack notification:', message);
      return;
    }

    try {
      if (isUpdate && this.messageTs) {
        // Update existing message
        await this.updateMessage(message, iconEmoji);
      } else {
        // Send new message
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
  }
}

// Global instance for backward compatibility
const slackManager = new SlackMessageManager();

export async function sendSlack(slackMessage: string, iconEmoji = ':receipt:') {
  await slackManager.sendOrUpdate(slackMessage, iconEmoji, false);
}

export async function updateSlack(slackMessage: string, iconEmoji = ':receipt:') {
  await slackManager.sendOrUpdate(slackMessage, iconEmoji, true);
}

export function resetSlackMessage() {
  slackManager.reset();
}

// Export the class for direct usage
export { SlackMessageManager };

export async function promisePool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let i = 0;

  // Запускаем столько воркеров, сколько разрешено concurrency (или меньше, если задач мало)
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break; // задачи кончились
      await worker(items[idx], idx);
    }
  });

  await Promise.all(workers);
}
