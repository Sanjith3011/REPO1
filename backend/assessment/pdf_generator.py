from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io


# ── College Details ─────────────────────────────────────────────────
COLLEGE_NAME     = "JAI SHRIRAM ENGINEERING COLLEGE"
COLLEGE_SUBTITLE = "(An Autonomous Institution)"
COLLEGE_LOCATION = "TIRUPPUR – 638 660"
COLLEGE_APPROVAL = "Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai"
COLLEGE_ACCRED   = "Recognized by UGC & Accredited by NBA (CSE and ECE)"
# ────────────────────────────────────────────────────────────────────


def generate_marks_pdf(context):
    """
    context = {
        'department': str,
        'batch': str,
        'year': str,
        'semester': int,
        'assessment_type': str,
        'subjects': [{'code':..,'name':..}],
        'students': [{'roll_no':..,'name':..,'marks':[..or 'AB'],'pass_count':.,'fail_count':.,'absent_count':..}],
        'subject_summary': [{'attended':.,'pass':.,'fail':.,'pass_pct':..}],
        'class_summary': {'total':.,'attended':.,'pass':.,'fail':.,'pass_pct':.,'arrear_1':.,'arrear_2':.,'arrear_3plus':..}
    }
    """
    buffer = io.BytesIO()
    page_size = landscape(A4)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )

    styles = getSampleStyleSheet()

    # ── Letterhead styles ──
    college_style = ParagraphStyle(
        'college', parent=styles['Normal'],
        fontSize=16, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceAfter=2,
        textColor=colors.HexColor('#7B1C1C'),  # deep maroon
    )
    subtitle_style = ParagraphStyle(
        'subtitle', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica',
        alignment=TA_CENTER, spaceAfter=2,
        textColor=colors.HexColor('#333333'),
    )
    location_style = ParagraphStyle(
        'location', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceAfter=2,
        textColor=colors.HexColor('#7B1C1C'),
    )
    approval_style = ParagraphStyle(
        'approval', parent=styles['Normal'],
        fontSize=8, fontName='Helvetica',
        alignment=TA_CENTER, spaceAfter=1,
        textColor=colors.HexColor('#555555'),
    )

    # ── Document section styles ──
    section_head_style = ParagraphStyle(
        'sechead', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceAfter=4, spaceBefore=4,
        textColor=colors.HexColor('#1a237e'),
    )
    info_style = ParagraphStyle(
        'info', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica',
        alignment=TA_CENTER, spaceAfter=2,
    )
    section_style = ParagraphStyle(
        'section', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica-Bold',
        spaceAfter=3, spaceBefore=6,
    )

    ASSESSMENT_LABELS = {
        'CT1': 'Class Test – 1', 'CT2': 'Class Test – 2', 'CT3': 'Class Test – 3',
        'CAT1': 'Continuous Assessment Test – 1', 'CAT2': 'Continuous Assessment Test – 2',
    }
    assessment_label = ASSESSMENT_LABELS.get(context['assessment_type'], context['assessment_type'])

    MAROON = colors.HexColor('#7B1C1C')
    NAVY   = colors.HexColor('#1a237e')
    GOLD   = colors.HexColor('#C8922A')

    story = []

    # ════════════════════════════════════════════════════════
    # COLLEGE LETTERHEAD
    # ════════════════════════════════════════════════════════
    story.append(Paragraph(COLLEGE_NAME, college_style))
    story.append(Paragraph(COLLEGE_SUBTITLE, subtitle_style))
    story.append(Paragraph(COLLEGE_LOCATION, location_style))
    story.append(Paragraph(COLLEGE_APPROVAL, approval_style))
    story.append(Paragraph(COLLEGE_ACCRED, approval_style))

    # Gold + maroon double-rule divider
    story.append(Spacer(1, 0.15 * cm))
    story.append(HRFlowable(width="100%", thickness=3, color=MAROON, spaceAfter=1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD,   spaceAfter=0.25 * cm))

    # ════════════════════════════════════════════════════════
    # ASSESSMENT DETAILS HEADER
    # ════════════════════════════════════════════════════════
    story.append(Paragraph(
        f"INTERNAL ASSESSMENT — {assessment_label.upper()}",
        section_head_style
    ))
    story.append(Paragraph(
        f"Department: <b>{context['department']}</b> &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"Batch: <b>{context['batch']}</b> &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"Year: <b>{context['year']}</b> &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"Semester: <b>{context['semester']}</b>",
        info_style
    ))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceAfter=0.2 * cm))

    subjects = context['subjects']
    students = context['students']

    # ════════════════════════════════════════════════════════
    # MARKS TABLE
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("Student Marks", section_style))

    CELL_STYLE = ParagraphStyle('cell', fontSize=7, alignment=TA_CENTER)
    CELL_LEFT  = ParagraphStyle('cell_left', fontSize=7, alignment=TA_LEFT)

    header_row = ['S.No', 'Register No', 'Student Name']
    for s in subjects:
        header_row.append(Paragraph(f"<b>{s['code']}</b><br/><font size='6'>{s['name']}</font>", CELL_STYLE))
    header_row += ['Pass', 'Fail', 'AB']

    table_data = [header_row]

    for i, st in enumerate(students):
        row = [str(i + 1), st['roll_no'], st['name']]
        for mark_val in st['marks']:
            row.append(str(mark_val) if mark_val is not None else '—')
        row += [str(st['pass_count']), str(st['fail_count']), str(st['absent_count'])]
        table_data.append(row)

    # Summary rows
    for label, key in [('Attended', 'attended'), ('Pass', 'pass'), ('Fail', 'fail')]:
        row = ['', '', label]
        for s in context['subject_summary']:
            row.append(str(s[key]))
        row += ['', '', '']
        table_data.append(row)

    pct_row = ['', '', 'Pass %']
    for s in context['subject_summary']:
        pct_row.append(f"{s['pass_pct']:.1f}%")
    pct_row += ['', '', '']
    table_data.append(pct_row)

    n_cols      = len(header_row)
    col_widths  = [0.9 * cm, 2.8 * cm, 4.2 * cm] + [2.0 * cm] * len(subjects) + [1.1 * cm, 1.1 * cm, 1.0 * cm]
    n_data_rows = len(students) + 1  # +1 for header

    marks_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    marks_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND',    (0, 0), (-1, 0), MAROON),
        ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
        ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, 0), 7),

        # Data
        ('FONTSIZE',      (0, 1), (-1, -1), 7),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),

        # Alternating rows
        ('ROWBACKGROUNDS', (0, 1), (-1, n_data_rows), [colors.white, colors.HexColor('#fdf5f5')]),

        # Summary rows background (yellow-ish)
        ('BACKGROUND',    (0, n_data_rows + 1), (-1, -1), colors.HexColor('#fffde7')),
        ('FONTNAME',      (2, n_data_rows + 1), (2, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR',     (2, n_data_rows + 1), (2, -1), MAROON),

        # Pass and fail column colors in data rows
        ('TEXTCOLOR',     (-3, 1), (-3, n_data_rows), colors.HexColor('#256329')),  # pass col
        ('TEXTCOLOR',     (-2, 1), (-2, n_data_rows), colors.HexColor('#b71c1c')),  # fail col
        ('TEXTCOLOR',     (-1, 1), (-1, n_data_rows), colors.HexColor('#5b21b6')),  # absent col

        ('FONTNAME',      (-3, 1), (-1, n_data_rows), 'Helvetica-Bold'),

        # Grid
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('LINEBELOW',     (0, 0), (-1, 0), 1.5, GOLD),  # gold line under header

        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING',   (2, 0), (2, -1), 4),
        ('ALIGN',         (2, 0), (2, -1), 'LEFT'),  # student name left-aligned
    ]))
    story.append(marks_table)

    # ════════════════════════════════════════════════════════
    # SUBJECT-WISE PERFORMANCE SUMMARY TABLE
    # ════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Subject-wise Performance Summary", section_style))

    subj_header = ['S.No', 'Name of the Subject', 'Name of the Staff', 'Attended', 'Passed', 'Failed', 'Pass %']
    subj_data   = [subj_header]

    for i, (subj, ss) in enumerate(zip(subjects, context['subject_summary'])):
        name_cell = f"{subj['code']} – {subj['name']}"
        staff     = subj.get('staff_name', '') or '—'
        subj_data.append([
            str(i + 1),
            name_cell,
            staff,
            str(ss['attended']),
            str(ss['pass']),
            str(ss['fail']),
            f"{ss['pass_pct']:.1f}%",
        ])

    subj_table = Table(
        subj_data,
        colWidths=[1*cm, 7*cm, 4.5*cm, 2*cm, 2*cm, 2*cm, 2*cm],
        repeatRows=1
    )
    subj_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0), MAROON),
        ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
        ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (1, 0), (2, -1), 'LEFT'),
        ('LEFTPADDING',   (1, 0), (2, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fdf5f5')]),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('LINEBELOW',     (0, 0), (-1, 0), 1.5, GOLD),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TEXTCOLOR',     (4, 1), (4, -1), colors.HexColor('#256329')),   # Pass col
        ('TEXTCOLOR',     (5, 1), (5, -1), colors.HexColor('#b71c1c')),   # Fail col
        ('FONTNAME',      (4, 1), (6, -1), 'Helvetica-Bold'),
    ]))
    story.append(subj_table)

    # ════════════════════════════════════════════════════════
    # BOTTOM TWO-COLUMN SUMMARY
    # ════════════════════════════════════════════════════════
    cs = context['class_summary']
    story.append(Spacer(1, 0.4 * cm))

    # Left table: class counts
    left_data = [
        ['1', 'TOTAL NO OF STUDENTS',    str(cs['total'])],
        ['2', 'NO OF STUDENTS ATTENDED', str(cs['attended'])],
        ['3', 'NO OF STUDENTS PASSED',   str(cs['pass'])],
        ['4', 'NO OF STUDENTS FAILED',   str(cs['fail'])],
    ]
    left_table = Table(left_data, colWidths=[0.8*cm, 6*cm, 2.5*cm])
    left_table.setStyle(TableStyle([
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('FONTNAME',      (1, 0), (1, -1), 'Helvetica-Bold'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',         (1, 0), (1, -1), 'LEFT'),
        ('LEFTPADDING',   (1, 0), (1, -1), 6),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [colors.white, colors.HexColor('#fdf5f5')]),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    # Pass % row below left table
    pct_data = [['', 'Over all Class Pass Percentage :', f"{cs['pass_pct']:.1f}%"]]
    pct_table = Table(pct_data, colWidths=[0.8*cm, 6*cm, 2.5*cm])
    pct_table.setStyle(TableStyle([
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('FONTNAME',      (1, 0), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',         (1, 0), (1, -1), 'RIGHT'),
        ('TEXTCOLOR',     (2, 0), (2, -1), colors.HexColor('#256329')),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('BACKGROUND',    (0, 0), (-1, -1), colors.HexColor('#fffbee')),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    # Right table: arrear distribution
    right_data = [
        ['1', 'No of Students fail in 1 Subject',       str(cs['arrear_1'])],
        ['2', 'No of Students fail in 2 Subjects',      str(cs['arrear_2'])],
        ['3', 'No of Students fail in 3 Subjects',      str(cs['arrear_3plus'])],
        ['4', 'No of Students fail in 4 Subjects',      '0'],
        ['5', 'No of Students Wash Out (All fail)',      '0'],
    ]
    right_table = Table(right_data, colWidths=[0.8*cm, 6*cm, 2.5*cm])
    right_table.setStyle(TableStyle([
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',         (1, 0), (1, -1), 'LEFT'),
        ('LEFTPADDING',   (1, 0), (1, -1), 6),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [colors.white, colors.HexColor('#fff0f0')]),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    # Side-by-side using a flat combined table
    # Build merged rows: left col | gap | right col
    max_rows = max(len(left_data), len(right_data))
    empty_left  = ['', '', '']
    empty_right = ['', '', '']

    combined_rows = []
    for r in range(max_rows):
        left_row  = left_data[r]  if r < len(left_data)  else empty_left
        right_row = right_data[r] if r < len(right_data) else empty_right
        combined_rows.append(left_row + [''] + right_row)

    combined_table = Table(combined_rows, colWidths=[0.8*cm, 5.8*cm, 2.3*cm, 0.6*cm, 0.8*cm, 5.8*cm, 2.3*cm])
    combined_table.setStyle(TableStyle([
        ('FONTSIZE',       (0, 0), (-1, -1), 8),
        # Left label column bold
        ('FONTNAME',       (1, 0), (1, -1), 'Helvetica-Bold'),
        # Center everything; left-align label columns
        ('ALIGN',          (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',          (1, 0), (1, -1), 'LEFT'),
        ('ALIGN',          (5, 0), (5, -1), 'LEFT'),
        ('LEFTPADDING',    (1, 0), (1, -1), 6),
        ('LEFTPADDING',    (5, 0), (5, -1), 6),
        # Grid for left columns (0-2) and right columns (4-6)
        ('GRID',           (0, 0), (2, -1), 0.5, colors.HexColor('#cccccc')),
        ('GRID',           (4, 0), (6, -1), 0.5, colors.HexColor('#cccccc')),
        # Alternating rows
        ('ROWBACKGROUNDS', (0, 0), (2, -1), [colors.white, colors.HexColor('#fdf5f5')]),
        ('ROWBACKGROUNDS', (4, 0), (6, -1), [colors.white, colors.HexColor('#fff0f0')]),
        ('TOPPADDING',     (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING',  (0, 0), (-1, -1), 3),
        # Gap column: no border, white background
        ('BACKGROUND',     (3, 0), (3, -1), colors.white),
        ('LINEAFTER',      (2, 0), (2, -1), 0, colors.white),
        ('LINEBEFORE',     (4, 0), (4, -1), 0, colors.white),
    ]))
    story.append(combined_table)

    # Pass % row (under left only)
    pct_data = [['', 'Over all Class Pass Percentage :', f"{cs['pass_pct']:.1f}%", '', '', '', '']]
    pct_table = Table(pct_data, colWidths=[0.8*cm, 5.8*cm, 2.3*cm, 0.6*cm, 0.8*cm, 5.8*cm, 2.3*cm])
    pct_table.setStyle(TableStyle([
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('FONTNAME',      (0, 0), (2, -1), 'Helvetica-Bold'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN',         (1, 0), (1, -1), 'RIGHT'),
        ('TEXTCOLOR',     (2, 0), (2, -1), colors.HexColor('#256329')),
        ('GRID',          (0, 0), (2, -1), 0.5, colors.HexColor('#cccccc')),
        ('BACKGROUND',    (0, 0), (2, -1), colors.HexColor('#fffbee')),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(pct_table)

    # ════════════════════════════════════════════════════════
    # MARK DISTRIBUTION SUMMARY TABLE
    # ════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Mark Distribution Summary", section_style))

    dist_header = ['S.No', 'Subject Code', 'Subject Name', 'Fail', '50-59%', '60-69%', '70-79%', '80-89%', '90-100%']
    dist_data = [dist_header]

    for i, (subj, ss) in enumerate(zip(subjects, context['subject_summary'])):
        dist_data.append([
            str(i + 1),
            subj['code'],
            subj['name'],
            str(ss.get('fail', 0)),
            str(ss.get('r50_60', 0)),
            str(ss.get('r60_70', 0)),
            str(ss.get('r70_80', 0)),
            str(ss.get('r80_90', 0)),
            str(ss.get('r90_100', 0)),
        ])

    dist_table = Table(
        dist_data,
        colWidths=[1*cm, 2.5*cm, 8.5*cm, 1.25*cm, 1.25*cm, 1.25*cm, 1.25*cm, 1.25*cm, 1.25*cm],
        repeatRows=1
    )
    dist_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0), MAROON),
        ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
        ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, 0), (-1, -1), 8),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (1, 0), (2, -1), 'LEFT'),
        ('LEFTPADDING',   (1, 0), (2, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fdf5f5')]),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('LINEBELOW',     (0, 0), (-1, 0), 1.5, GOLD),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TEXTCOLOR',     (3, 1), (3, -1), colors.HexColor('#b71c1c')),   # Fail col red
    ]))
    story.append(dist_table)

    # ── Signature line ──────────────────────────────────────
    story.append(Spacer(1, 0.8 * cm))
    sig_data = [['Prepared by', 'Verified by', 'Head of Department']]
    sig_table = Table(sig_data, colWidths=[6 * cm, 6 * cm, 6 * cm])
    sig_table.setStyle(TableStyle([
        ('FONTSIZE',   (0, 0), (-1, -1), 8),
        ('FONTNAME',   (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('LINEABOVE',  (0, 0), (-1, 0), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
