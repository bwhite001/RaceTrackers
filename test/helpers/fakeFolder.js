/** An in-memory stand-in for a FileSystemDirectoryHandle. */
export function fakeFolder({ fail = null, permission = 'granted' } = {}) {
  const files = {};
  return {
    name: 'Backups',
    files,
    fail,
    permission,
    writes: 0,
    open: 0,
    maxOpen: 0,
    delay: 0,
    async queryPermission() { return this.permission; },
    async requestPermission() { this.permission = 'granted'; return 'granted'; },
    async getFileHandle(name) {
      const folder = this;
      return {
        async createWritable() {
          if (folder.fail) { const e = folder.fail; folder.fail = null; throw e; }
          folder.writes += 1;
          folder.open += 1;
          folder.maxOpen = Math.max(folder.maxOpen, folder.open);
          const chunks = [];
          return {
            async write(c) { chunks.push(c); },
            async close() {
              for (let i = 0; i < folder.delay; i++) await new Promise(r => setImmediate(r)); // a slow disk
              files[name] = chunks.join('');
              folder.open -= 1;
            },
          };
        },
      };
    },
  };
}
