package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var version = "0.1.0"

var rootCmd = &cobra.Command{
	Use:   "geck-validator",
	Short: "A CLI tool for validating GECK data sources and schemas",
	Long: `geck-validator is a command-line tool that validates
GECK static data sources and schema files.

Use the 'validate' command with either 'data-source' or 'schema'
subcommand to validate your files.`,
	Version: version,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.AddCommand(validateCmd)
}
