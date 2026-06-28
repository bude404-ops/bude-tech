def build_patch(file_path, new_content):
    return {
        "file": file_path,
        "content": new_content,
        "type": "overwrite"
    }


def diff_style_patch(old, new):
    return {
        "type": "diff",
        "old": old,
        "new": new
    }
