from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, PolyLine, Polygon, Line, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend
import io
import math


# ── College Details ─────────────────────────────────────────────────
COLLEGE_NAME     = "JAI SHRIRAM ENGINEERING COLLEGE"
COLLEGE_SUBTITLE = "(An Autonomous Institution)"
COLLEGE_LOCATION = "TIRUPPUR – 638 660"
COLLEGE_APPROVAL = "Approved by AICTE, New Delhi & Affiliated to Anna University, Chennai"
COLLEGE_ACCRED   = "Recognized by UGC & Accredited by NBA (CSE and ECE)"
# ────────────────────────────────────────────────────────────────────


# ── Drawing Helpers ─────────────────────────────────────────────────
def generate_bell_curve(mu, sigma, width=440, height=180):
    if sigma <= 0: sigma = 0.5
    
    d = Drawing(width, height)
    
    # Shaded range (+/- 3 sigma)
    x_range_min = mu - 3.5 * sigma
    x_range_max = mu + 3.5 * sigma
    
    def f(x):
        # Normal dist formula
        return (1.0 / (sigma * math.sqrt(2 * math.pi))) * math.exp(-0.5 * ((x - mu) / sigma) ** 2)

    y_max_val = f(mu)
    
    # Mapping helpers
    def get_x(val):
        return (val - x_range_min) / (x_range_max - x_range_min) * (0.85 * width) + (0.075 * width)
    
    def get_y(val):
        return (val / y_max_val) * (0.75 * height) + (0.15 * height)

    # Shaded zones: 3rd (light), 2nd (medium), 1st (dark blue)
    # Zone colors matching the provided image style
    z_colors = [
        colors.HexColor('#a2c4d9'), # 3rd sigma zone
        colors.HexColor('#6294b5'), # 2nd sigma zone
        colors.HexColor('#01578c')  # 1st sigma zone
    ]
    
    for i, mult in enumerate([3, 2, 1]):
        x_s = mu - mult * sigma
        x_e = mu + mult * sigma
        points = [get_x(x_s), get_y(0)] # Start bottom left
        
        # Curve points across this range
        n_steps = 30
        for s in range(n_steps + 1):
            px = x_s + (x_e - x_s) * s / n_steps
            points.append(get_x(px))
            points.append(get_y(f(px)))
            
        points.extend([get_x(x_e), get_y(0)]) # Close at bottom right
        d.add(Polygon(points, fillColor=z_colors[i], strokeColor=None))

    # Main Curve Line
    curve_points = []
    n_total = 100
    for s in range(n_total + 1):
        px = x_range_min + (x_range_max - x_range_min) * s / n_total
        curve_points.append(get_x(px))
        curve_points.append(get_y(f(px)))
    d.add(PolyLine(curve_points, strokeColor=colors.black, strokeWidth=1))

    # Vertical Mean line
    d.add(Line(get_x(mu), get_y(0), get_x(mu), get_y(y_max_val), strokeColor=colors.black, strokeWidth=1, strokeDashArray=[2, 2]))

    # X-axis ticks and labels
    # Base line
    d.add(Line(get_x(x_range_min), get_y(0), get_x(x_range_max), get_y(0), strokeColor=colors.black, strokeWidth=0.8))
    
    # Tick marks for mu and sigmas
    for mult in [-3, -2, -1, 0, 1, 2, 3]:
        val = mu + mult * sigma
        vx = get_x(val)
        d.add(Line(vx, get_y(0), vx, get_y(0) - 4, strokeColor=colors.black, strokeWidth=1))
        d.add(String(vx, get_y(0) - 12, f"{val:.1f}", fontSize=7, textAnchor='middle', fontName='Helvetica'))

    # Probability labels (approx matching user image)
    d.add(String(get_x(mu + 1.2 * sigma), get_y(f(mu + 1.2 * sigma)) + 5, "68%", fontSize=7, fontName='Helvetica-Bold'))
    d.add(String(get_x(mu + 2.1 * sigma), get_y(f(mu + 2.1 * sigma)) + 5, "95%", fontSize=7, fontName='Helvetica-Bold'))

    # Legend symbols (top left)
    legend_x = 20
    legend_y = height - 15
    d.add(Line(legend_x, legend_y, legend_x + 15, legend_y, strokeColor=colors.HexColor('#01578c'), strokeWidth=2))
    d.add(String(legend_x + 20, legend_y - 2, f"σ = {sigma:.3f}", fontSize=8, fontName='Helvetica'))
    
    d.add(Line(legend_x, legend_y - 12, legend_x + 15, legend_y - 12, strokeColor=colors.black, strokeWidth=1, strokeDashArray=[2, 2]))
    d.add(String(legend_x + 20, legend_y - 14, f"μ = {mu:.3f}", fontSize=8, fontName='Helvetica'))

    return d


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

    subj_header = ['S.No', 'Name of the Subject', 'Name of the Staff', 'Attended', 'Passed', 'Failed', 'Mean', 'Median', 'Mode', 'S.D', 'Pass %']
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
            str(ss['mean']),
            str(ss['median']),
            str(ss['mode']),
            str(ss['stdev']),
            f"{ss['pass_pct']:.1f}%",
        ])

    subj_table = Table(
        subj_data,
        colWidths=[0.8*cm, 5.2*cm, 3.4*cm, 1.4*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.5*cm],
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

    # ════════════════════════════════════════════════════════
    # GRAPHS
    # ════════════════════════════════════════════════════════
    story.append(Spacer(1, 1 * cm))

    # Pass Percentage Chart
    pass_pct_data = []
    subject_names = []
    for ss in context['subject_summary']:
        pass_pct_data.append(ss['pass_pct'])
        subject_names.append(ss['code'])

    if pass_pct_data:
        d = Drawing(600, 200)
        chart = VerticalBarChart()
        chart.width = 500
        chart.height = 130
        chart.x = 50
        chart.y = 40
        chart.data = [pass_pct_data]
        chart.categoryAxis.categoryNames = subject_names
        chart.categoryAxis.labels.boxAnchor = 'ne'
        chart.categoryAxis.labels.dx = 0
        chart.categoryAxis.labels.dy = -2
        chart.categoryAxis.labels.angle = 0
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = 100
        chart.valueAxis.valueStep = 20
        chart.bars[0].fillColor = colors.HexColor('#256329') # pass color

        d.add(chart)
        story.append(KeepTogether([
            Paragraph("Subject-wise Pass Percentage", section_style),
            d
        ]))

    # Individual Subject Bell Curves (Normal Distribution)
    if context['subject_summary']:
        story.append(Spacer(1, 0.4 * cm))
        story.append(Paragraph("Subject-wise Standard Deviation (Normal Distribution Graphs)", section_style))
        story.append(Spacer(1, 0.2 * cm))
        
        for ss in context['subject_summary']:
            # Use generate_bell_curve instead of BarChart
            d_bell = generate_bell_curve(ss['mean'], ss['stdev'])
            
            story.append(KeepTogether([
                Paragraph(f"<b>{ss['code']}</b> – {ss['name']}", info_style),
                d_bell,
                Spacer(1, 0.4 * cm)
            ]))

    # Mark Distribution Chart
    dist_data = [[], [], [], [], [], []]
    series_names = ['Fail', '50-59%', '60-69%', '70-79%', '80-89%', '90-100%']
    series_colors = [
        colors.HexColor('#b71c1c'), # Fail
        colors.HexColor('#ff9800'), # 50-59
        colors.HexColor('#ffeb3b'), # 60-69
        colors.HexColor('#4caf50'), # 70-79
        colors.HexColor('#2196f3'), # 80-89
        colors.HexColor('#3f51b5')  # 90-100
    ]

    for ss in context['subject_summary']:
        dist_data[0].append(ss.get('fail', 0))
        dist_data[1].append(ss.get('r50_60', 0))
        dist_data[2].append(ss.get('r60_70', 0))
        dist_data[3].append(ss.get('r70_80', 0))
        dist_data[4].append(ss.get('r80_90', 0))
        dist_data[5].append(ss.get('r90_100', 0))

    if pass_pct_data:
        story.append(Spacer(1, 0.5 * cm))
        d_dist = Drawing(600, 220)
        chart_dist = VerticalBarChart()
        chart_dist.width = 450
        chart_dist.height = 130
        chart_dist.x = 50
        chart_dist.y = 40
        chart_dist.data = dist_data
        chart_dist.categoryAxis.categoryNames = subject_names
        chart_dist.categoryAxis.labels.boxAnchor = 'ne'
        chart_dist.categoryAxis.labels.dx = 0
        chart_dist.categoryAxis.labels.dy = -2
        chart_dist.categoryAxis.labels.angle = 0
        
        max_val = max([max(s) for s in dist_data]) if dist_data and dist_data[0] else 10
        chart_dist.valueAxis.valueMin = 0
        chart_dist.valueAxis.valueMax = max(max_val + max_val//5 + 1, 5)
        chart_dist.valueAxis.valueStep = max(1, chart_dist.valueAxis.valueMax // 5)
        
        for i, col in enumerate(series_colors):
            chart_dist.bars[i].fillColor = col
            
        legend = Legend()
        legend.x = 520
        legend.y = 170
        legend.dx = 8
        legend.dy = 8
        legend.fontName = 'Helvetica'
        legend.fontSize = 8
        legend.boxAnchor = 'nw'
        legend.columnMaximum = 6
        legend.alignment = 'right'
        legend.colorNamePairs = [(series_colors[i], series_names[i]) for i in range(len(series_names))]
        
        d_dist.add(chart_dist)
        d_dist.add(legend)
        
        story.append(KeepTogether([
            Paragraph("Mark Distribution by Subject", section_style),
            d_dist
        ]))

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
