/**
 * Generate bash completion script for cf CLI.
 *
 * Installation:
 *   cf completion bash >> ~/.bashrc
 *   source ~/.bashrc
 */

export function generateBash(): string {
  return `#!/usr/bin/env bash
# cf CLI bash completion
# Install: cf completion bash >> ~/.bashrc && source ~/.bashrc

_cf_completions() {
    local cur prev words cword
    _init_completion -n = || return

    local commands="zones dns accounts user cache config completion"
    local global_flags="--profile --output --raw --verbose --quiet --no-color --yes --help"

    # Zone subcommands
    local zones_cmds="list get create delete"
    local zones_list_flags="--account-id --name --status --page --per-page --all"
    local zones_get_flags="--id --name"
    local zones_create_flags="--name --account-id --jump-start --type"
    local zones_delete_flags="--id --yes"

    # DNS subcommands
    local dns_cmds="list get create update patch delete import export"
    local dns_list_flags="--zone --type --name --content --page --per-page --all"
    local dns_get_flags="--zone --id"
    local dns_create_flags="--zone --type --name --content --ttl --proxied --priority --comment"
    local dns_update_flags="--zone --id --type --name --content --ttl --proxied --priority"
    local dns_patch_flags="--zone --id --content --ttl --proxied --comment"
    local dns_delete_flags="--zone --id --yes"
    local dns_import_flags="--zone --file --proxied"
    local dns_export_flags="--zone"

    # Accounts subcommands
    local accounts_cmds="list get"
    local accounts_list_flags="--page --per-page"
    local accounts_get_flags="--id"

    # User subcommands
    local user_cmds="get token"
    local user_token_cmds="verify"

    # Cache subcommands
    local cache_cmds="purge"
    local cache_purge_flags="--zone --everything --urls --tags --hosts --prefixes --yes"

    # Config subcommands
    local config_cmds="set get list delete use"
    local config_set_flags="--profile --token --api-key --email --account-id --zone-id --output"
    local config_get_flags="--profile"
    local config_delete_flags="--profile --yes"

    # Completion subcommands
    local completion_cmds="bash zsh fish"

    # Determine context based on word position
    case "\${cword}" in
        1)
            COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
            return
            ;;
        2)
            case "\${words[1]}" in
                zones)    COMPREPLY=( \$(compgen -W "\${zones_cmds}" -- "\${cur}") ) ;;
                dns)      COMPREPLY=( \$(compgen -W "\${dns_cmds}" -- "\${cur}") ) ;;
                accounts) COMPREPLY=( \$(compgen -W "\${accounts_cmds}" -- "\${cur}") ) ;;
                user)     COMPREPLY=( \$(compgen -W "\${user_cmds}" -- "\${cur}") ) ;;
                cache)    COMPREPLY=( \$(compgen -W "\${cache_cmds}" -- "\${cur}") ) ;;
                config)   COMPREPLY=( \$(compgen -W "\${config_cmds}" -- "\${cur}") ) ;;
                completion) COMPREPLY=( \$(compgen -W "\${completion_cmds}" -- "\${cur}") ) ;;
            esac
            return
            ;;
        *)
            # Provide flag completions based on command context
            local cmd1="\${words[1]}"
            local cmd2="\${words[2]}"
            local flags=""

            case "\${cmd1}" in
                zones)
                    case "\${cmd2}" in
                        list) flags="\${zones_list_flags}" ;;
                        get)  flags="\${zones_get_flags}" ;;
                        create) flags="\${zones_create_flags}" ;;
                        delete) flags="\${zones_delete_flags}" ;;
                    esac
                    ;;
                dns)
                    case "\${cmd2}" in
                        list)   flags="\${dns_list_flags}" ;;
                        get)    flags="\${dns_get_flags}" ;;
                        create) flags="\${dns_create_flags}" ;;
                        update) flags="\${dns_update_flags}" ;;
                        patch)  flags="\${dns_patch_flags}" ;;
                        delete) flags="\${dns_delete_flags}" ;;
                        import) flags="\${dns_import_flags}" ;;
                        export) flags="\${dns_export_flags}" ;;
                    esac
                    ;;
                accounts)
                    case "\${cmd2}" in
                        list) flags="\${accounts_list_flags}" ;;
                        get)  flags="\${accounts_get_flags}" ;;
                    esac
                    ;;
                user)
                    if [[ "\${cmd2}" == "token" ]] && [[ "\${cword}" -eq 3 ]]; then
                        COMPREPLY=( \$(compgen -W "\${user_token_cmds}" -- "\${cur}") )
                        return
                    fi
                    ;;
                cache)
                    case "\${cmd2}" in
                        purge) flags="\${cache_purge_flags}" ;;
                    esac
                    ;;
                config)
                    case "\${cmd2}" in
                        set)    flags="\${config_set_flags}" ;;
                        get)    flags="\${config_get_flags}" ;;
                        delete) flags="\${config_delete_flags}" ;;
                    esac
                    ;;
            esac

            COMPREPLY=( \$(compgen -W "\${flags} \${global_flags}" -- "\${cur}") )
            return
            ;;
    esac
}

complete -F _cf_completions cf
`;
}
