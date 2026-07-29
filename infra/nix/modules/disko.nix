# Disk layout for fisioweb-app, declared via disko.
#
# BIOS/GPT with a 1M BIOS boot partition (type EF02) for grub, then a
# single ext4 root taking the rest of the disk. Hetzner Cloud x86_64 VMs
# boot in legacy BIOS mode — UEFI/systemd-boot doesn't load. The 1M EF02
# partition holds grub's stage 1.5, written by grub-install at activation.
#
# Real production layout (separate /home, mount points for the attached
# Volume holding postgres+valkey data) lands later.

{
  disko.devices.disk.main = {
    type = "disk";
    # NOT /dev/sdX. Those names track attach order, not identity: once
    # the Hetzner data volume was attached it claimed /dev/sda and the
    # root disk became /dev/sdb, so grub-install aimed at the volume and
    # the switch died with "cross-disk install ... embedding is not
    # possible". Root itself never noticed — disko mounts / by
    # partlabel — so the breakage only surfaces at bootloader install.
    #
    # by-path is stable across reboots and volume attach/detach: Hetzner
    # Cloud puts the root disk on LUN 0 of the virtio-scsi controller and
    # every attached volume on LUN 1+. Confirm on the host with
    # `ls -l /dev/disk/by-path/` if a future instance type moves the
    # controller off 0000:06:00.0.
    device = "/dev/disk/by-path/pci-0000:06:00.0-scsi-0:0:0:0";
    content = {
      type = "gpt";
      partitions = {
        boot = {
          size = "1M";
          type = "EF02";  # BIOS boot
          priority = 1;
        };
        root = {
          size = "100%";
          content = {
            type = "filesystem";
            format = "ext4";
            mountpoint = "/";
          };
        };
      };
    };
  };
}
