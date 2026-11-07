/** An in-memory stand-in for a FileSystemDirectoryHandle. */
export function fakeFolder({ fail = null, permission = 'granted' } = {}) {
  const files = {};
  return {
    name: 'Backups',
    files,
    fail,
    permission,
    writes: 0,
    async queryPermission() { return this.permission; },
    async requestPermission() { this.permission = 'granted'; return 'granted'; },
    async getFileHandle(name) {
      const folder = this;
      return {
        async createWritable() {
          if (folder.fail) { const e = folder.fail; folder.fail = null; throw e; }
          folder.writes += 1;
          const chunks = [];
          return { async write(c) { chunks.push(c); }, async close() { files[name] = chunks.join(''); } };
        },
      };
    },
  };
}
