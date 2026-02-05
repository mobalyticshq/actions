package cmd

import (
	"github.com/spf13/cobra"
)

var validateCmd = &cobra.Command{
	Use:   "validate",
	Short: "Validate data sources or schemas",
	Long: `The validate command provides subcommands for validating
GECK data source files and schema files.

Available subcommands:
  data-source    Validate a static data source file
  schema         Validate a schema file
  compatibility  Validate schema backward compatibility`,
}

func init() {
	validateCmd.AddCommand(dataSourceCmd)
	validateCmd.AddCommand(schemaCmd)
	validateCmd.AddCommand(compatibilityCmd)
}
