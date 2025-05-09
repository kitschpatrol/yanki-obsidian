# Hot-Reload Plugin for Obsidian.md Plugins

If you develop plugins for [Obsidian.md](https://Obsidian.md/), you may be familiar with the frequent need to either restart/reload Obsidian, or else go into its plugin settings to disable and re-enable the plugin you're working on.

Well, you don't need to do that any more.  Just install this plugin, and let it do all the work.  When enabled, this plugin automatically watches for changes to the `main.js` or `styles.css` of any plugin whose directory includes a `.git` subdirectory or a file called `.hotreload`, and then automatically disables and re-enables that plugin once changes have stopped for about three-quarters of a second.  A notice will appear briefly in Obsidian when the reload occurs.  (The verbose logs in the developer tools will also reflect this.)

The plugin also watches for changes to `manifest.json` files, and the addition or removal of `.git` or `.hotreload`, and updates its watch lists accordingly.  So there's no configuration needed to add or remove plugins from the hot reload list: just put your new plugin(s) under revision control or create a `.hotreload` file in them.

(And, since Obsidian only includes `main.js` and `styles.css` in plugin downloads, you don't have to worry about `.hotreload` escaping into the wild: when other people download your plugin from the Obsidian marketplace, it won't be hot-reloaded, even if they're using the hot-reload plugin, too.)

Note, however, that if you have this plugin enabled, then it *can* enable plugins that are not currently enabled in the settings, so long as you've checked them out using git or have added a `.hotreload` file.  (For development, this is actually a good thing, because when you make a change that breaks the plugin load process, all you need to do is save your file(s) again, and hotreload will try to enable it again, saving you from having to reload or go back to the settings again.)

Finally, note that while this plugin takes care of the grunt work of reloading your plugin, please keep in mind that it's your *plugin's* job to properly clean up after itself.  If you're not making good use of `onunload()` and the various `registerX()` methods to ensure all your changes unload properly, then you may leave Obsidian in an unstable state, forcing you to restart or reload to restore the app to a working state.

### Installation

This is an Obsidian plugin like any other, and must be cloned or unzipped into your vault's `.obsidian/plugins/` directory (or similar one if you've overridden the `.obsidian` directory name in the Obsidian settings), then enabled in the Obsidian configuration.  It's not registered as a standard community plugin for downloading or updating within Obsidian, because it's intended for developer use only, and because it can enable other plugins.

### Symlinks

Hot-reload supports directory symlinks, if you want to have a plugin folder that symlinks to your build.  However, it's usually simpler to do it the other way around, e.g. `ln -s /some/Vault/.obsidian/plugins/my-plugin ./dist` to make your builder write into your dev/test vault.  File symlinks are not supported.

### Mobile Plugin Development

This plugin was designed for the desktop and has not been tested on Obsidian mobile.  If you want to get hot-reloading on mobile, you have two main options besides this plugin, depending on what synchronization tool/service you're using:

- Obsidian Sync service: Enable the "Sync > Vault configuration sync, Installed community plugins" setting for Obsidian to automatically restart modified plugins after sync (Thanks to @ChasKane for providing this tip).  (NOTE: if you do this, you should *not* enable Hot Reload or you will have double-reloading of changed plugins!)

- Other Sync tools: the [Hot Reload Mobile](https://github.com/shabegom/obsidian-hot-reload-mobile) plugin works with any synchronization mechanism that updates notes, by writing to a note on desktop to trigger the reload on mobile after the note syncs.

As of 0.1.12, this plugin has been changed so it *should* run on mobile, but it is not tested yet, so you have to manually remove the `"isDesktopOnly": true,` line from `manifest.json`.  If you try it and it works for you (or doesn't!), please let me know via an issue.