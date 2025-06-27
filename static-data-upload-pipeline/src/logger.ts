export const logColors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

export const logger = {
  info: (msg: string) => {
    console.log(`${logColors.blue}ℹ️  ${msg}${logColors.reset}`);
  },

  group: (title: string) => {
    console.log(`::group::${title}`);
  },

  endGroup: () => {
    console.log('::endgroup::');
  },

};