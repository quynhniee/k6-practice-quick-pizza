#!/bin/bash

# k6 Test Runner Script for Pizza API
# This script provides easy commands to run different types of tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
K6_VERSION="0.47.0"


ROOT_DIR="$(pwd)"
REPORTS_DIR="${ROOT_DIR}/src/reports"
SCRIPTS_DIR="${ROOT_DIR}/src/main/scripts"

# Ensure reports directory exists
# mkdir -p "$REPORTS_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first."
        print_status "Visit: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    print_success "k6 is installed: $(k6 version)"
}

# Function for JavaScript (no compilation needed)
prepare_js() {
    print_status "Using JavaScript files (no compilation needed)..."
    print_success "Ready to run tests"
}

# Function to run smoke tests
run_smoke_test() {
    print_status "Running smoke tests..."
    local output_file="$REPORTS_DIR/smoke-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        --env TEST_TYPE=smoke \
        "$SCRIPTS_DIR/order-pizza.js" || {
        print_error "Smoke test failed"
        return 1
    }
    
    print_success "Smoke test completed. Report saved to: $output_file"
}

# Function to run load tests
run_load_test() {
    print_status "Running load tests..."
    local output_file="$REPORTS_DIR/load-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        --env TEST_TYPE=load \
        "$SCRIPTS_DIR/order-pizza.js" || {
        print_error "Load test failed"
        return 1
    }
    
    print_success "Load test completed. Report saved to: $output_file"
}

# Function to run stress tests
run_stress_test() {
    print_status "Running stress tests..."
    local output_file="$REPORTS_DIR/stress-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        --env TEST_TYPE=stress \
        "$SCRIPTS_DIR/order-pizza.js" || {
        print_error "Stress test failed"
        return 1
    }
    
    print_success "Stress test completed. Report saved to: $output_file"
}

# Function to run spike tests
run_spike_test() {
    print_status "Running spike tests..."
    local output_file="$REPORTS_DIR/spike-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        --env TEST_TYPE=spike \
        "$SCRIPTS_DIR/order-pizza.js" || {
        print_error "Spike test failed"
        return 1
    }
    
    print_success "Spike test completed. Report saved to: $output_file"
}

# Function to run functional tests
run_functional_test() {
    print_status "Running functional tests..."
    local output_file="$REPORTS_DIR/functional-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        "$SCRIPTS_DIR/functional-tests.js" || {
        print_error "Functional test failed"
        return 1
    }
    
    print_success "Functional test completed. Report saved to: $output_file"
}

# Function to run boundary tests
run_boundary_test() {
    print_status "Running boundary/edge case tests..."
    local output_file="$REPORTS_DIR/boundary-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        "$SCRIPTS_DIR/boundary-tests.js" || {
        print_error "Boundary test failed"
        return 1
    }
    
    print_success "Boundary test completed. Report saved to: $output_file"
}

# Function to run performance tests
run_performance_test() {
    print_status "Running comprehensive performance tests..."
    local output_file="$REPORTS_DIR/performance-test-$(date +%Y%m%d-%H%M%S).json"
    
    k6 run \
        --out json="$output_file" \
        "$SCRIPTS_DIR/performance-tests.js" || {
        print_error "Performance test failed"
        return 1
    }
    
    print_success "Performance test completed. Report saved to: $output_file"
}

# Function to run all tests
run_all_tests() {
    print_status "Running all test suites..."
    
    # Run tests in order of increasing load
    run_functional_test
    run_boundary_test
    run_smoke_test
    run_load_test
    run_stress_test
    run_spike_test
    
    print_success "All tests completed successfully!"
}

# Function to clean reports
clean_reports() {
    print_status "Cleaning old reports..."
    rm -rf "$REPORTS_DIR"/*
    print_success "Reports directory cleaned"
}

# Function to show help
show_help() {
    echo "k6 Pizza API Test Runner"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  smoke       Run smoke tests (minimal load)"
    echo "  load        Run load tests (normal expected load)"
    echo "  stress      Run stress tests (beyond normal capacity)"
    echo "  spike       Run spike tests (sudden load increase)"
    echo "  functional  Run functional tests (API behavior validation)"
    echo "  boundary    Run boundary/edge case tests"
    echo "  performance Run comprehensive performance tests"
    echo "  all         Run all test suites"
    echo "  clean       Clean old reports"
    echo "  compile     Prepare JavaScript files"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 smoke              # Quick smoke test"
    echo "  $0 load               # Standard load test"
    echo "  $0 functional         # API functionality tests"
    echo "  $0 all                # Run complete test suite"
    echo ""
}

# Main script logic
main() {
    case "${1:-help}" in
        "check")
            check_k6
            ;;
        "compile")
            prepare_js
            ;;
        "smoke")
            check_k6
            prepare_js
            run_smoke_test
            ;;
        "load")
            check_k6
            prepare_js
            run_load_test
            ;;
        "stress")
            check_k6
            prepare_js
            run_stress_test
            ;;
        "spike")
            check_k6
            prepare_js
            run_spike_test
            ;;
        "functional")
            check_k6
            prepare_js
            run_functional_test
            ;;
        "boundary")
            check_k6
            prepare_js
            run_boundary_test
            ;;
        "performance")
            check_k6
            prepare_js
            run_performance_test
            ;;
        "all")
            check_k6
            prepare_js
            run_all_tests
            ;;
        "clean")
            clean_reports
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
