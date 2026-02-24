/**
 * Generate fish completion script for cf CLI.
 *
 * Installation:
 *   cf completion fish > ~/.config/fish/completions/cf.fish
 */

export function generateFish(): string {
  return `# cf CLI fish completion
# Install: cf completion fish > ~/.config/fish/completions/cf.fish

# Disable file completions by default
complete -c cf -f

# Helper: no subcommand yet
function __cf_no_subcommand
    set -l cmd (commandline -opc)
    test (count $cmd) -eq 1
end

# Helper: check if specific subcommand is active
function __cf_using_command
    set -l cmd (commandline -opc)
    if test (count $cmd) -ge 2
        if test "$cmd[2]" = "$argv[1]"
            return 0
        end
    end
    return 1
end

# Helper: check two-level subcommand
function __cf_using_subcommand
    set -l cmd (commandline -opc)
    if test (count $cmd) -ge 3
        if test "$cmd[2]" = "$argv[1]" -a "$cmd[3]" = "$argv[2]"
            return 0
        end
    end
    return 1
end

# Global flags
complete -c cf -l profile -d 'Profile name' -r
complete -c cf -l output -d 'Output format' -r -a 'table json csv yaml'
complete -c cf -l raw -d 'Show raw API response'
complete -c cf -l verbose -d 'Verbose output'
complete -c cf -l quiet -d 'Suppress output'
complete -c cf -l no-color -d 'Disable color output'
complete -c cf -l yes -d 'Skip confirmations'
complete -c cf -l help -d 'Show help'

# Top-level commands
complete -c cf -n __cf_no_subcommand -a zones -d 'Manage Cloudflare zones'
complete -c cf -n __cf_no_subcommand -a dns -d 'Manage DNS records'
complete -c cf -n __cf_no_subcommand -a accounts -d 'Manage accounts'
complete -c cf -n __cf_no_subcommand -a user -d 'User and token operations'
complete -c cf -n __cf_no_subcommand -a cache -d 'Cache management'
complete -c cf -n __cf_no_subcommand -a config -d 'CLI configuration'
complete -c cf -n __cf_no_subcommand -a completion -d 'Generate shell completions'

# --- Zones ---
complete -c cf -n '__cf_using_command zones' -a list -d 'List all zones'
complete -c cf -n '__cf_using_command zones' -a get -d 'Get zone details'
complete -c cf -n '__cf_using_command zones' -a create -d 'Create a new zone'
complete -c cf -n '__cf_using_command zones' -a delete -d 'Delete a zone'

# zones list
complete -c cf -n '__cf_using_subcommand zones list' -l account-id -d 'Filter by account ID' -r
complete -c cf -n '__cf_using_subcommand zones list' -l name -d 'Filter by zone name' -r
complete -c cf -n '__cf_using_subcommand zones list' -l status -d 'Filter by status' -r -a 'active pending initializing moved deleted deactivated read_only'
complete -c cf -n '__cf_using_subcommand zones list' -l page -d 'Page number' -r
complete -c cf -n '__cf_using_subcommand zones list' -l per-page -d 'Results per page' -r
complete -c cf -n '__cf_using_subcommand zones list' -l all -d 'Fetch all pages'

# zones get
complete -c cf -n '__cf_using_subcommand zones get' -l id -d 'Zone ID' -r
complete -c cf -n '__cf_using_subcommand zones get' -l name -d 'Zone domain name' -r

# zones create
complete -c cf -n '__cf_using_subcommand zones create' -l name -d 'Domain name' -r
complete -c cf -n '__cf_using_subcommand zones create' -l account-id -d 'Account ID' -r
complete -c cf -n '__cf_using_subcommand zones create' -l jump-start -d 'Enable jump start'
complete -c cf -n '__cf_using_subcommand zones create' -l type -d 'Zone type' -r -a 'full partial secondary'

# zones delete
complete -c cf -n '__cf_using_subcommand zones delete' -l id -d 'Zone ID' -r
complete -c cf -n '__cf_using_subcommand zones delete' -l yes -d 'Skip confirmation'

# --- DNS ---
complete -c cf -n '__cf_using_command dns' -a list -d 'List DNS records'
complete -c cf -n '__cf_using_command dns' -a get -d 'Get a DNS record'
complete -c cf -n '__cf_using_command dns' -a create -d 'Create a DNS record'
complete -c cf -n '__cf_using_command dns' -a update -d 'Full update a DNS record'
complete -c cf -n '__cf_using_command dns' -a patch -d 'Partial update a DNS record'
complete -c cf -n '__cf_using_command dns' -a delete -d 'Delete a DNS record'
complete -c cf -n '__cf_using_command dns' -a import -d 'Import DNS records'
complete -c cf -n '__cf_using_command dns' -a export -d 'Export DNS records'

set -l dns_types 'A AAAA CAA CERT CNAME DNSKEY DS HTTPS LOC MX NAPTR NS PTR SMIMEA SRV SSHFP SVCB TLSA TXT URI'

# dns list
complete -c cf -n '__cf_using_subcommand dns list' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns list' -l type -d 'Record type' -r -a "$dns_types"
complete -c cf -n '__cf_using_subcommand dns list' -l name -d 'Record name' -r
complete -c cf -n '__cf_using_subcommand dns list' -l content -d 'Record content' -r
complete -c cf -n '__cf_using_subcommand dns list' -l page -d 'Page number' -r
complete -c cf -n '__cf_using_subcommand dns list' -l per-page -d 'Results per page' -r
complete -c cf -n '__cf_using_subcommand dns list' -l all -d 'Fetch all pages'

# dns get
complete -c cf -n '__cf_using_subcommand dns get' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns get' -l id -d 'Record ID' -r

# dns create
complete -c cf -n '__cf_using_subcommand dns create' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns create' -l type -d 'Record type' -r -a "$dns_types"
complete -c cf -n '__cf_using_subcommand dns create' -l name -d 'Record name' -r
complete -c cf -n '__cf_using_subcommand dns create' -l content -d 'Record content' -r
complete -c cf -n '__cf_using_subcommand dns create' -l ttl -d 'TTL (1=auto)' -r
complete -c cf -n '__cf_using_subcommand dns create' -l proxied -d 'Enable proxy'
complete -c cf -n '__cf_using_subcommand dns create' -l priority -d 'Priority' -r
complete -c cf -n '__cf_using_subcommand dns create' -l comment -d 'Comment' -r

# dns update
complete -c cf -n '__cf_using_subcommand dns update' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns update' -l id -d 'Record ID' -r
complete -c cf -n '__cf_using_subcommand dns update' -l type -d 'Record type' -r -a "$dns_types"
complete -c cf -n '__cf_using_subcommand dns update' -l name -d 'Record name' -r
complete -c cf -n '__cf_using_subcommand dns update' -l content -d 'Record content' -r
complete -c cf -n '__cf_using_subcommand dns update' -l ttl -d 'TTL' -r
complete -c cf -n '__cf_using_subcommand dns update' -l proxied -d 'Enable proxy'
complete -c cf -n '__cf_using_subcommand dns update' -l priority -d 'Priority' -r

# dns patch
complete -c cf -n '__cf_using_subcommand dns patch' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns patch' -l id -d 'Record ID' -r
complete -c cf -n '__cf_using_subcommand dns patch' -l content -d 'Record content' -r
complete -c cf -n '__cf_using_subcommand dns patch' -l ttl -d 'TTL' -r
complete -c cf -n '__cf_using_subcommand dns patch' -l proxied -d 'Enable proxy'
complete -c cf -n '__cf_using_subcommand dns patch' -l comment -d 'Comment' -r

# dns delete
complete -c cf -n '__cf_using_subcommand dns delete' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns delete' -l id -d 'Record ID' -r
complete -c cf -n '__cf_using_subcommand dns delete' -l yes -d 'Skip confirmation'

# dns import
complete -c cf -n '__cf_using_subcommand dns import' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand dns import' -l file -d 'BIND file path' -r -F
complete -c cf -n '__cf_using_subcommand dns import' -l proxied -d 'Proxy imported records'

# dns export
complete -c cf -n '__cf_using_subcommand dns export' -l zone -d 'Zone ID or name' -r

# --- Accounts ---
complete -c cf -n '__cf_using_command accounts' -a list -d 'List all accounts'
complete -c cf -n '__cf_using_command accounts' -a get -d 'Get account details'

complete -c cf -n '__cf_using_subcommand accounts list' -l page -d 'Page number' -r
complete -c cf -n '__cf_using_subcommand accounts list' -l per-page -d 'Results per page' -r
complete -c cf -n '__cf_using_subcommand accounts get' -l id -d 'Account ID' -r

# --- User ---
complete -c cf -n '__cf_using_command user' -a get -d 'Get current user'
complete -c cf -n '__cf_using_command user' -a token -d 'Token operations'
complete -c cf -n '__cf_using_subcommand user token' -a verify -d 'Verify token'

# --- Cache ---
complete -c cf -n '__cf_using_command cache' -a purge -d 'Purge cached content'

complete -c cf -n '__cf_using_subcommand cache purge' -l zone -d 'Zone ID or name' -r
complete -c cf -n '__cf_using_subcommand cache purge' -l everything -d 'Purge everything'
complete -c cf -n '__cf_using_subcommand cache purge' -l urls -d 'URLs to purge' -r
complete -c cf -n '__cf_using_subcommand cache purge' -l tags -d 'Cache tags' -r
complete -c cf -n '__cf_using_subcommand cache purge' -l hosts -d 'Hosts to purge' -r
complete -c cf -n '__cf_using_subcommand cache purge' -l prefixes -d 'URL prefixes' -r
complete -c cf -n '__cf_using_subcommand cache purge' -l yes -d 'Skip confirmation'

# --- Config ---
complete -c cf -n '__cf_using_command config' -a set -d 'Set profile configuration'
complete -c cf -n '__cf_using_command config' -a get -d 'Show profile details'
complete -c cf -n '__cf_using_command config' -a list -d 'List all profiles'
complete -c cf -n '__cf_using_command config' -a delete -d 'Delete a profile'
complete -c cf -n '__cf_using_command config' -a use -d 'Set default profile'

complete -c cf -n '__cf_using_subcommand config set' -l profile -d 'Profile name' -r
complete -c cf -n '__cf_using_subcommand config set' -l token -d 'API token' -r
complete -c cf -n '__cf_using_subcommand config set' -l api-key -d 'API key' -r
complete -c cf -n '__cf_using_subcommand config set' -l email -d 'API email' -r
complete -c cf -n '__cf_using_subcommand config set' -l account-id -d 'Account ID' -r
complete -c cf -n '__cf_using_subcommand config set' -l zone-id -d 'Zone ID' -r
complete -c cf -n '__cf_using_subcommand config set' -l output -d 'Output format' -r -a 'table json csv yaml'

complete -c cf -n '__cf_using_subcommand config get' -l profile -d 'Profile name' -r
complete -c cf -n '__cf_using_subcommand config delete' -l profile -d 'Profile name' -r
complete -c cf -n '__cf_using_subcommand config delete' -l yes -d 'Skip confirmation'

# --- Completion ---
complete -c cf -n '__cf_using_command completion' -a 'bash zsh fish' -d 'Shell type'
`;
}
