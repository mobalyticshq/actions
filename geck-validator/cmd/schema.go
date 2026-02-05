package cmd

import (
	"fmt"
	"os"

	"geck-validator/internal/validator"

	"github.com/spf13/cobra"
)

var schemaFile string

var schemaCmd = &cobra.Command{
	Use:   "schema",
	Short: "Validate a schema file",
	Long: `Validate a GECK schema JSON file.

The schema file defines the structure of static data with namespaces,
type prefixes, groups, fields, and objects.`,
	Example: `  geck-validator validate schema --file ./schema.json
  geck-validator validate schema -f ./schema.json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if schemaFile == "" {
			return fmt.Errorf("file path is required, use --file or -f flag")
		}

		errors, err := validator.ValidateSchema(schemaFile)
		if err != nil {
			return fmt.Errorf("failed to validate schema: %w", err)
		}

		if len(errors) == 0 {
			fmt.Println("✓ Schema validation passed")
			return nil
		}

		fmt.Printf("✗ Schema validation failed with %d error(s):\n\n", len(errors))
		for _, e := range errors {
			fmt.Printf("  [%s] %s\n", e.Type, e.Message)
			if e.Path != "" {
				fmt.Printf("         Path: %s\n", e.Path)
			}
		}
		os.Exit(1)
		return nil
	},
}

func init() {
	schemaCmd.Flags().StringVarP(&schemaFile, "file", "f", "", "path to the schema JSON file (required)")
	schemaCmd.MarkFlagRequired("file")
}
