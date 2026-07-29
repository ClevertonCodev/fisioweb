{
  description = "fisioweb — NixOS for the fisioweb-app host";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Source tree the Laravel app is built from.
    #
    # This is the repo itself, fetched over the network rather than read
    # from the local checkout — that's what makes a deploy reproducible:
    # the VM gets exactly the tree at a named git ref, not whatever
    # happens to be dirty in your working directory.
    #
    # The default points at main so a fresh clone can evaluate with no
    # extra flags (install.sh relies on this). deploy.sh overrides it
    # with --override-input to pin whatever --ref you pass.
    #
    # shallow=1 → depth-1 clone, which is all we need since flake=false
    # means Nix never reads history.
    fisiowebSource = {
      url = "git+ssh://git@github.com/ClevertonCodev/fisioweb?ref=main&shallow=1";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, disko, sops-nix, fisiowebSource }: {
    nixosConfigurations.fisioweb-app = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inherit fisiowebSource; };
      modules = [
        disko.nixosModules.disko
        sops-nix.nixosModules.sops
        ./infra/nix/modules/disko.nix
        ./infra/nix/modules/fisioweb-app.nix
      ];
    };
  };
}
