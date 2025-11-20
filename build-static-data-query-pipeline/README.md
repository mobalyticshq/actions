# Build Static Data Query Pipeline

GitHub Action for building and processing static data queries.

## Usage

```yaml
- name: Build Static Data Query
  uses: ./build-static-data-query-pipeline
  with:
    token: ${{ secrets.ACTION_ACCESS_TOKEN }}
```

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

## License

MIT

