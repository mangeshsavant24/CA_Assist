from api.schemas import FinancialAuditInput, FinancialAuditOutput, AuditFinding


class FinancialAuditEngine:
    """Engine for financial audit planning and findings management."""

    def evaluate(self, request: FinancialAuditInput) -> FinancialAuditOutput:
        """
        Conduct financial audit assessment across specified areas.
        Generates findings, risk assessment, and recommendations.
        """
        # Generate audit findings based on scope
        findings = self._generate_audit_findings(
            request.audit_type, request.audit_scope, request.company_name
        )

        # Overall assessment
        overall_assessment = self._assess_overall_compliance(findings)

        # Compliance status
        compliance_status = self._determine_compliance_status(findings)

        # Calculate materiality threshold
        materiality = self._calculate_materiality(request.audit_type)

        # Auditor recommendation
        auditor_rec = self._generate_auditor_recommendation(
            findings, compliance_status, request.audit_type
        )

        return FinancialAuditOutput(
            audit_type=request.audit_type,
            company_name=request.company_name,
            fiscal_year=request.fiscal_year,
            findings=findings,
            overall_assessment=overall_assessment,
            compliance_status=compliance_status,
            materiality_threshold=round(materiality, 2),
            auditor_recommendation=auditor_rec,
            currency=request.currency,
        )

    def _generate_audit_findings(
        self, audit_type: str, audit_scope: list, company_name: str
    ) -> list:
        """Generate audit findings based on scope areas."""
        findings = []
        finding_templates = {
            "Revenue": {
                "areas": [
                    "Revenue recognition policy compliance with IND-AS 115",
                    "Year-end cut-off testing",
                    "Customer credit assessment and allowances",
                ],
                "severity": "High",
            },
            "Inventory": {
                "areas": [
                    "Inventory valuation per AS-2/IND-AS 2",
                    "Obsolescence assessment",
                    "Reconciliation of physical vs system records",
                ],
                "severity": "High",
            },
            "Receivables": {
                "areas": [
                    "Aging analysis and collectibility",
                    "Doubtful debts provision adequacy",
                    "Related party transactions",
                ],
                "severity": "Medium",
            },
            "Payables": {
                "areas": [
                    "Accruals completeness",
                    "Dispute resolution status",
                    "Trade payable aging",
                ],
                "severity": "Medium",
            },
            "Fixed Assets": {
                "areas": [
                    "Capitalisation vs expense policy",
                    "Depreciation computation accuracy",
                    "Impairment testing",
                ],
                "severity": "High",
            },
            "Bank & Cash": {
                "areas": [
                    "Bank reconciliation current",
                    "Unusual transactions",
                    "Group cash pooling arrangements",
                ],
                "severity": "Critical",
            },
        }

        for scope_area in audit_scope:
            if scope_area in finding_templates:
                template = finding_templates[scope_area]
                severity = template["severity"]

                for idx, area_detail in enumerate(template["areas"]):
                    findings.append(
                        AuditFinding(
                            area=scope_area,
                            severity=severity,
                            finding=area_detail,
                            recommendation=self._generate_recommendation_for_area(
                                scope_area, area_detail, audit_type
                            ),
                        )
                    )

        if not findings:
            findings.append(
                AuditFinding(
                    area="General",
                    severity="Low",
                    finding="No specific audit scope items selected",
                    recommendation="Select audit scope areas for detailed findings",
                )
            )

        return findings

    def _generate_recommendation_for_area(
        self, area: str, finding: str, audit_type: str
    ) -> str:
        """Generate recommendation for specific audit finding."""
        recommendations = {
            "IND-AS": "Ensure compliance with applicable IND-AS standards and FEMA regulations",
            "aging": "Perform detailed analysis and obtain management justification",
            "obsolescence": "Review slow-moving/obsolete inventory and provision accordingly",
            "reconciliation": "Resolve all reconciling items and maintain supporting documentation",
            "cut-off": "Perform transactions sampling and verify proper period assignment",
        }

        for key, rec in recommendations.items():
            if key.lower() in finding.lower():
                return rec

        return "Perform detailed testing and obtain management representations"

    def _assess_overall_compliance(self, findings: list) -> str:
        """Assess overall compliance status."""
        critical_count = sum(1 for f in findings if f.severity == "Critical")
        high_count = sum(1 for f in findings if f.severity == "High")

        if critical_count > 0:
            return (
                f"Non-compliant - {critical_count} critical findings require immediate attention"
            )
        elif high_count > 3:
            return (
                f"Partially compliant - {high_count} significant issues need resolution"
            )
        else:
            return "Substantially compliant - remediate identified items within reasonable timeframe"

    def _determine_compliance_status(self, findings: list) -> str:
        """Determine audit compliance status."""
        if not findings or all(f.severity == "Low" for f in findings):
            return "PASS - Unqualified Opinion"
        elif any(f.severity == "Critical" for f in findings):
            return "FAIL - Qualified Opinion with limitations"
        else:
            return "CONDITIONAL - Qualified Opinion subject to remediation"

    def _calculate_materiality(self, audit_type: str) -> float:
        """Calculate materiality threshold based on audit type."""
        materiality_thresholds = {
            "Statutory": 500000,  # ₹5 lakhs or 1% of revenue
            "Internal": 100000,   # ₹1 lakh
            "Compliance": 250000, # ₹2.5 lakhs
            "Forensic": 50000,    # ₹50k conservative
        }
        return materiality_thresholds.get(audit_type, 500000)

    def _generate_auditor_recommendation(
        self, findings: list, compliance_status: str, audit_type: str
    ) -> str:
        """Generate overall auditor recommendation."""
        if "PASS" in compliance_status:
            return (
                f"Recommend issuing clean/unqualified audit report. "
                f"Minor observations noted for management attention."
            )
        elif "FAIL" in compliance_status:
            return (
                f"Recommend qualified audit opinion. "
                f"Critical findings must be resolved before financial statement finalization."
            )
        else:
            return (
                f"Recommend conditional approval pending remediation. "
                f"Obtain management representations on item resolution. "
                f"Follow-up audit suggested per SA 260."
            )
