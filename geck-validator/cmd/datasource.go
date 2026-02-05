package cmd

import (
	"fmt"
	"os"

	"geck-validator/internal/validator"

	"github.com/spf13/cobra"
)

var dataSourceFile string

var dataSourceCmd = &cobra.Command{
	Use:   "data-source",
	Short: "Validate a static data source file",
	Long: `Validate a GECK static data source JSON file.

The data source file should contain groups with arrays of objects,
where each object has at least an 'id' field.`,
	Example: `  geck-validator validate data-source --file ./static_data.json
  geck-validator validate data-source -f ./static_data.json`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if dataSourceFile == "" {
			return fmt.Errorf("file path is required, use --file or -f flag")
		}

		errors, err := validator.ValidateDataSource(dataSourceFile)
		if err != nil {
			return fmt.Errorf("failed to validate data source: %w", err)
		}

		if len(errors) == 0 {
			fmt.Println("✓ Data source validation passed")
			return nil
		}

		fmt.Printf("✗ Data source validation failed with %d error(s):\n\n", len(errors))
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
	dataSourceCmd.Flags().StringVarP(&dataSourceFile, "file", "f", "", "path to the data source JSON file (required)")
	dataSourceCmd.MarkFlagRequired("file")
}
