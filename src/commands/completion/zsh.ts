/**
 * Generate zsh completion script for cf CLI.
 *
 * Installation:
 *   cf completion zsh >> ~/.zshrc
 *   source ~/.zshrc
 */

export function generateZsh(): string {
  return `#compdef cf
# cf CLI zsh completion
# Install: cf completion zsh >> ~/.zshrc && source ~/.zshrc

_cf() {
    local -a commands
    commands=(
        'zones:Manage Cloudflare zones'
        'dns:Manage DNS records'
        'accounts:Manage accounts'
        'user:User and token operations'
        'cache:Cache management'
        'config:CLI configuration'
        'completion:Generate shell completions'
    )

    local -a global_flags
    global_flags=(
        '--profile[Profile name]:profile:'
        '--output[Output format]:format:(table json csv yaml)'
        '--raw[Show raw API response]'
        '--verbose[Verbose output]'
        '--quiet[Suppress output]'
        '--no-color[Disable color output]'
        '--yes[Skip confirmations]'
        '--help[Show help]'
    )

    _arguments -C \\
        '1:command:->command' \\
        '*::arg:->args' \\
        \${global_flags[@]}

    case \$state in
        command)
            _describe -t commands 'cf commands' commands
            ;;
        args)
            case \$words[1] in
                zones) _cf_zones ;;
                dns) _cf_dns ;;
                accounts) _cf_accounts ;;
                user) _cf_user ;;
                cache) _cf_cache ;;
                config) _cf_config ;;
                completion) _cf_completion ;;
            esac
            ;;
    esac
}

_cf_zones() {
    local -a subcmds
    subcmds=(
        'list:List all zones'
        'get:Get zone details'
        'create:Create a new zone'
        'delete:Delete a zone'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'zones commands' subcmds
            ;;
        args)
            case \$words[1] in
                list)
                    _arguments \\
                        '--account-id[Filter by account ID]:id:' \\
                        '--name[Filter by zone name]:name:' \\
                        '--status[Filter by status]:status:(active pending initializing moved deleted deactivated read_only)' \\
                        '--page[Page number]:page:' \\
                        '--per-page[Results per page]:count:' \\
                        '--all[Fetch all pages]'
                    ;;
                get)
                    _arguments \\
                        '--id[Zone ID]:id:' \\
                        '--name[Zone domain name]:name:'
                    ;;
                create)
                    _arguments \\
                        '--name[Domain name]:name:' \\
                        '--account-id[Account ID]:id:' \\
                        '--jump-start[Enable jump start]' \\
                        '--type[Zone type]:type:(full partial secondary)'
                    ;;
                delete)
                    _arguments \\
                        '--id[Zone ID]:id:' \\
                        '--yes[Skip confirmation]'
                    ;;
            esac
            ;;
    esac
}

_cf_dns() {
    local -a subcmds
    subcmds=(
        'list:List DNS records'
        'get:Get a DNS record'
        'create:Create a DNS record'
        'update:Full update a DNS record'
        'patch:Partial update a DNS record'
        'delete:Delete a DNS record'
        'import:Import DNS records from BIND file'
        'export:Export DNS records as BIND format'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'dns commands' subcmds
            ;;
        args)
            case \$words[1] in
                list)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--type[Record type]:type:(A AAAA CAA CERT CNAME DNSKEY DS HTTPS LOC MX NAPTR NS PTR SMIMEA SRV SSHFP SVCB TLSA TXT URI)' \\
                        '--name[Record name]:name:' \\
                        '--content[Record content]:content:' \\
                        '--page[Page number]:page:' \\
                        '--per-page[Results per page]:count:' \\
                        '--all[Fetch all pages]'
                    ;;
                get)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--id[Record ID]:id:'
                    ;;
                create)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--type[Record type]:type:(A AAAA CAA CERT CNAME DNSKEY DS HTTPS LOC MX NAPTR NS PTR SMIMEA SRV SSHFP SVCB TLSA TXT URI)' \\
                        '--name[Record name]:name:' \\
                        '--content[Record content]:content:' \\
                        '--ttl[TTL (1=auto, 60-86400)]:ttl:' \\
                        '--proxied[Enable Cloudflare proxy]' \\
                        '--priority[MX/SRV priority]:priority:' \\
                        '--comment[Record comment]:comment:'
                    ;;
                update)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--id[Record ID]:id:' \\
                        '--type[Record type]:type:(A AAAA CAA CERT CNAME DNSKEY DS HTTPS LOC MX NAPTR NS PTR SMIMEA SRV SSHFP SVCB TLSA TXT URI)' \\
                        '--name[Record name]:name:' \\
                        '--content[Record content]:content:' \\
                        '--ttl[TTL]:ttl:' \\
                        '--proxied[Enable Cloudflare proxy]' \\
                        '--priority[MX/SRV priority]:priority:'
                    ;;
                patch)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--id[Record ID]:id:' \\
                        '--content[Record content]:content:' \\
                        '--ttl[TTL]:ttl:' \\
                        '--proxied[Enable Cloudflare proxy]' \\
                        '--comment[Record comment]:comment:'
                    ;;
                delete)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--id[Record ID]:id:' \\
                        '--yes[Skip confirmation]'
                    ;;
                import)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--file[BIND file path]:file:_files' \\
                        '--proxied[Proxy imported records]'
                    ;;
                export)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:'
                    ;;
            esac
            ;;
    esac
}

_cf_accounts() {
    local -a subcmds
    subcmds=(
        'list:List all accounts'
        'get:Get account details'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'accounts commands' subcmds
            ;;
        args)
            case \$words[1] in
                list)
                    _arguments \\
                        '--page[Page number]:page:' \\
                        '--per-page[Results per page]:count:'
                    ;;
                get)
                    _arguments \\
                        '--id[Account ID]:id:'
                    ;;
            esac
            ;;
    esac
}

_cf_user() {
    local -a subcmds
    subcmds=(
        'get:Get current user details'
        'token:Token operations'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'user commands' subcmds
            ;;
        args)
            case \$words[1] in
                token)
                    local -a token_subcmds
                    token_subcmds=('verify:Verify token validity')
                    _describe -t token_subcmds 'token commands' token_subcmds
                    ;;
            esac
            ;;
    esac
}

_cf_cache() {
    local -a subcmds
    subcmds=(
        'purge:Purge cached content'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'cache commands' subcmds
            ;;
        args)
            case \$words[1] in
                purge)
                    _arguments \\
                        '--zone[Zone ID or name]:zone:' \\
                        '--everything[Purge everything]' \\
                        '--urls[URLs to purge (comma-separated)]:urls:' \\
                        '--tags[Cache tags to purge]:tags:' \\
                        '--hosts[Hosts to purge]:hosts:' \\
                        '--prefixes[URL prefixes to purge]:prefixes:' \\
                        '--yes[Skip confirmation]'
                    ;;
            esac
            ;;
    esac
}

_cf_config() {
    local -a subcmds
    subcmds=(
        'set:Set profile configuration'
        'get:Show profile details'
        'list:List all profiles'
        'delete:Delete a profile'
        'use:Set default profile'
    )

    _arguments -C \\
        '1:subcommand:->subcmd' \\
        '*::arg:->args'

    case \$state in
        subcmd)
            _describe -t subcmds 'config commands' subcmds
            ;;
        args)
            case \$words[1] in
                set)
                    _arguments \\
                        '--profile[Profile name]:name:' \\
                        '--token[API token]:token:' \\
                        '--api-key[API key]:key:' \\
                        '--email[API email]:email:' \\
                        '--account-id[Default account ID]:id:' \\
                        '--zone-id[Default zone ID]:id:' \\
                        '--output[Default output format]:format:(table json csv yaml)'
                    ;;
                get)
                    _arguments \\
                        '--profile[Profile name]:name:'
                    ;;
                delete)
                    _arguments \\
                        '--profile[Profile name]:name:' \\
                        '--yes[Skip confirmation]'
                    ;;
                use)
                    _arguments \\
                        '1:profile name:'
                    ;;
            esac
            ;;
    esac
}

_cf_completion() {
    local -a shells
    shells=(bash zsh fish)
    _describe -t shells 'shell' shells
}

compdef _cf cf
`;
}
