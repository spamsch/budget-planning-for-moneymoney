.PHONY: dev build check clean

dev:
	npm run tauri dev

build:
	npm run tauri build

check:
	cd src-tauri && cargo check
	npm run check

clean:
	cd src-tauri && cargo clean
	rm -rf build .svelte-kit
