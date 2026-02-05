package cmd

import (
	"fmt"
	"os"

	"geck-validator/internal/validator"

	"github.com/spf13/cobra"
)

var newSchemaFile string
var currentSchemaFile string

var compatibilityCmd = &cobra.Command{
	Use:   "compatibility",
	Short: "Validate schema backward compatibility",
	Long: `Validate that a new schema is backward compatible with the current schema.

This checks that no breaking changes have been introduced:
- Namespace and typePrefix cannot change
- Groups, objects, and fields cannot be deleted
- Field types cannot change
- Modifiers (required, filter, array) cannot be removed`,
	Example: `  geck-validator validate compatibility --new ./new_schema.json --current ./current_schema.json
  geck-validator validate compatibility -n ./new_schema.json -c ./current_schema.json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if newSchemaFile == "" {
			return fmt.Errorf("new schema file path is required, use --new or -n flag")
		}
		if currentSchemaFile == "" {
			return fmt.Errorf("current schema file path is required, use --current or -c flag")
		}

		errors, err := validator.ValidateCompatibility(newSchemaFile, currentSchemaFile)
		if err != nil {
			return fmt.Errorf("failed to validate compatibility: %w", err)
		}

		if len(errors) == 0 {
			fmt.Println("✓ Schema compatibility validation passed")
			return nil
		}

		fmt.Printf("✗ Schema compatibility validation failed with %d error(s):\n\n", len(errors))
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
	compatibilityCmd.Flags().StringVarP(&newSchemaFile, "new", "n", "", "path to the new schema JSON file (required)")
	compatibilityCmd.Flags().StringVarP(&currentSchemaFile, "current", "c", "", "path to the current/reference schema JSON file (required)")
	compatibilityCmd.MarkFlagRequired("new")
	compatibilityCmd.MarkFlagRequired("current")
}
